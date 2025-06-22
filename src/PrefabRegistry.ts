import PrefabComponent from './PrefabComponent';
import Prefab from './Prefab';
import { camelString } from './util/string-util';
import type { Engine } from './Engine';
import type { World } from './World';
import type { Entity } from './Entity';
import type { ComponentProperties } from './Component';
import type { ComponentClassWithMeta } from './PrefabComponent';

/**
 * Defines the structure for a component configuration within raw prefab data.
 * It can be a simple string (component type name) or an object specifying
 * type, properties, and overwrite behavior.
 */
interface PrefabComponentDataConfig {
    type: string;
    properties?: Partial<ComponentProperties>;
    overwrite?: boolean;
}
/** A component item in prefab data can be just its type name or a full configuration object. */
type PrefabComponentDataItem = string | PrefabComponentDataConfig;

/**
 * Defines the structure of the raw data used to register a prefab.
 * This data is typically provided in JSON or as a plain JavaScript object.
 */
export interface PrefabData {
    /** The unique name of the prefab. */
    name: string;
    /** Optional. A single prefab name or an array of names from which this prefab inherits. */
    inherit?: string | string[];
    /** Optional. An array of component definitions for this prefab. */
    components?: PrefabComponentDataItem[];
    /** Allows for other custom properties on prefab data if needed by specific applications. */
    [key: string]: any;
}

/**
 * Interface for the internal map that stores fully resolved `Prefab` instances,
 * keyed by their names.
 */
interface PrefabMap {
    [name: string]: Prefab;
}

/**
 * The PrefabRegistry manages prefab definitions, their resolution (including inheritance),
 * and the instantiation of entities from these prefabs.
 *
 * Relationships:
 * - Owned by an `Engine` instance.
 * - Uses the `Engine` to resolve component class constructors.
 * - Creates `Prefab` and `PrefabComponent` instances during deserialization.
 * - Instantiates `Entity` instances within a given `World`.
 *
 * Key Features:
 * - **Lazy Deserialization**: Prefab raw data is stored upon registration. The full resolution
 *   (parsing inheritance, creating `PrefabComponent` instances) only occurs when a prefab
 *   is first requested via `get()` or used in `create()`.
 * - **Inheritance**: Supports single and multiple inheritance. Parent prefabs are applied before
 *   the child prefab's own components.
 * - **Caching**: Resolved `Prefab` instances are cached to avoid reprocessing.
 */
export class PrefabRegistry {
    /** @private Cache for fully resolved `Prefab` instances, keyed by prefab name. */
    private _prefabs: PrefabMap = {};
    /** @private Stores the raw `PrefabData` as registered, keyed by prefab name. Used for lazy deserialization. */
    private _rawData: { [name: string]: PrefabData } = {};
    /** @private Reference to the `Engine` to access component definitions. */
    private _engine: Engine;

    /**
     * Creates a new PrefabRegistry.
     * @param engine The `Engine` instance this registry will use to look up component classes.
     */
    constructor(engine: Engine) {
        this._engine = engine;
    }

    /**
     * Deserializes raw prefab data into a fully resolved `Prefab` instance.
     * This is the core of prefab processing, handling inheritance and component definition parsing.
     * It's called by `get()` when a prefab is requested and not yet in the `_prefabs` cache.
     *
     * @param data The raw `PrefabData` to deserialize.
     * @returns A resolved `Prefab` instance.
     * @private This method is primarily for internal use by `get()`.
     */
    private deserialize(data: PrefabData): Prefab {
        // If already deserializing this prefab (e.g., due to circular inheritance), return cached instance.
        if (this._prefabs[data.name]) {
            return this._prefabs[data.name];
        }

        const prefab = new Prefab(data.name);
        // Add to cache early to handle potential circular dependencies during inheritance resolution.
        this._prefabs[data.name] = prefab;

        // Normalize `inherit` field to an array of names.
        let inheritNames: string[] = [];
        if (Array.isArray(data.inherit)) {
            inheritNames = data.inherit;
        } else if (typeof data.inherit === 'string') {
            inheritNames = [data.inherit];
        }

        // Resolve and assign parent prefabs.
        prefab.inherit = inheritNames.map((parentName: string) => {
            let parentPrefab = this._prefabs[parentName]; // Check cache first
            if (!parentPrefab) {
                // If not cached, try to find raw data and deserialize recursively.
                const parentData = this._rawData[parentName];
                if (parentData) {
                    parentPrefab = this.deserialize(parentData); // Recursive call
                }
            }

            if (!parentPrefab) {
                // This is a critical error: a parent prefab was named but never registered.
                console.error(`CRITICAL ERROR: Prefab "${data.name}" cannot inherit from prefab "${parentName}" because it was never registered.`);
                // Return a dummy prefab to satisfy type, but this indicates a broken state.
                return new Prefab(parentName); // Or throw an error
            }
            return parentPrefab;
        });

        // Process component definitions for this prefab.
        const componentConfigs = data.components || [];
        componentConfigs.forEach((componentData: PrefabComponentDataItem) => {
            let componentTypeName: string = 'unknown'; // Name of the component type (e.g., "Position")
            let properties: Partial<ComponentProperties> | undefined;
            let overwrite: boolean | undefined; // Default for PrefabComponent constructor is true

            // Normalize componentData to extract type, properties, and overwrite flag.
            if (typeof componentData === 'string') {
                componentTypeName = componentData;
            } else if (typeof componentData === 'object' && componentData.type) {
                componentTypeName = componentData.type;
                properties = componentData.properties;
                overwrite = componentData.overwrite; // Can be undefined, handled by PrefabComponent constructor
            }

            const ckey = camelString(componentTypeName); // Convert to internal key (e.g., "position")
            // Retrieve the component class constructor from the engine.
            const componentClass = this._engine.getComponentClass(ckey) as ComponentClassWithMeta | undefined;

            if (componentClass) {
                // Create a PrefabComponent definition and add it to the prefab.
                prefab.addComponent(new PrefabComponent(componentClass, properties, overwrite));
            } else {
                // Warn if a component type is referenced but not registered in the engine.
                console.warn(
                    `Unrecognized component reference "${componentTypeName}" (ckey: "${ckey}") in prefab "${data.name}". Ensure the component is registered with the engine.`,
                    componentData
                );
            }
        });
        return prefab;
    }

    /**
     * Registers raw prefab data with the registry.
     * The data is stored for lazy deserialization, meaning it's only fully processed
     * (inheritance resolved, component classes looked up) when the prefab is first needed.
     * @param data The `PrefabData` object to register.
     */
    register(data: PrefabData): void {
        if (this._rawData[data.name]) {
            console.warn(`Prefab "${data.name}" is already registered. Overwriting its raw data.`);
        }
        // Store the raw data, keyed by prefab name.
        this._rawData[data.name] = data;
        // Invalidate any previously resolved version of this prefab from the cache,
        // as its definition has now changed.
        if (this._prefabs[data.name]) {
            delete this._prefabs[data.name];
        }
    }

    /**
     * Retrieves a fully resolved `Prefab` instance by its name.
     * If the prefab has not been resolved yet (i.e., not in the `_prefabs` cache),
     * this method will trigger its deserialization from the stored `_rawData`.
     * @param name The name of the prefab to retrieve.
     * @returns A `Prefab` instance if found and resolved, otherwise `undefined`.
     */
    get(name: string): Prefab | undefined {
        // Check if already resolved and cached.
        if (this._prefabs[name]) {
            return this._prefabs[name];
        }

        // If not cached, try to find its raw data.
        const rawData = this._rawData[name];
        if (rawData) {
            // Raw data exists, so deserialize it (which also caches it in _prefabs).
            return this.deserialize(rawData);
        }

        // No raw data found, so the prefab doesn't exist.
        return undefined;
    }

    /**
     * Creates and returns a new entity instance from a registered prefab.
     * @param world The `World` in which to create the entity.
     * @param name The name of the prefab to instantiate.
     * @param properties Optional. An object with properties to override the prefab's
     *                   default component values for this specific instance.
     * @returns The newly created `Entity` instance, or `undefined` if the prefab doesn't exist.
     */
    create(world: World, name: string, properties: Partial<ComponentProperties> = {}): Entity | undefined {
        const prefab = this.get(name); // Get the resolved Prefab instance (triggers deserialization if needed)

        if (!prefab) {
            console.warn(
                `Cannot instantiate prefab "${name}" because it has not been registered or is invalid.`
            );
            return undefined;
        }

        // Create a new entity. Consider a naming convention for prefab-instantiated entities.
        const entity = world.createEntity(`${prefab.name}_${world.createId().substring(0,4)}`);

        // Temporarily disable query eligibility on the entity during component additions.
        // This can improve performance by avoiding redundant query updates for each added component.
        entity._qeligible = false;
        prefab.applyToEntity(entity, properties); // Apply the prefab's configuration to the entity
        entity._qeligible = true; // Re-enable query eligibility.

        entity._candidacy(); // Manually trigger a candidacy check now that all components are added.

        return entity;
    }
}
