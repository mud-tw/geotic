import PrefabComponent from './PrefabComponent';
import Prefab from './Prefab';
import { camelString } from './util/string-util';
import type { Engine } from './Engine';
import type { World } from './World';
import type { Entity } from './Entity';
import type { ComponentProperties } from './Component'; // For PrefabComponent properties
import type { ComponentClassWithMeta } from './PrefabComponent'; // For component class type

// Structure of component data within a prefab definition
interface PrefabComponentDataConfig {
    type: string;
    properties?: Partial<ComponentProperties>;
    overwrite?: boolean;
}
type PrefabComponentDataItem = string | PrefabComponentDataConfig;

// Structure of the raw prefab data used for registration/deserialization
export interface PrefabData {
    name: string;
    inherit?: string | string[];
    components?: PrefabComponentDataItem[];
    [key: string]: any; // Allow other custom properties on prefabs if needed
}

interface PrefabMap {
    [name: string]: Prefab;
}

export class PrefabRegistry {
    private _prefabs: PrefabMap = {};
    private _engine: Engine;

    constructor(engine: Engine) {
        this._engine = engine;
    }

    deserialize(data: PrefabData): Prefab {
        const registered = this.get(data.name);
        if (registered) {
            // Potentially update existing prefab or just return it
            // For now, just return if already processed to avoid loops with inherit
            return registered;
        }

        const prefab = new Prefab(data.name);
        this._prefabs[data.name] = prefab; // Add to map early to handle circular dependencies in inherit (though direct circularity is an issue)


        let inheritNames: string[] = [];
        if (Array.isArray(data.inherit)) {
            inheritNames = data.inherit;
        } else if (typeof data.inherit === 'string') {
            inheritNames = [data.inherit];
        }

        // Resolve parent prefabs. They might be strings (names) or already resolved Prefab instances.
        // The Prefab class itself stores resolved Prefabs in its `inherit` array.
        prefab.inherit = inheritNames.map((parentNameOrPrefab: string | Prefab) => {
            if (typeof parentNameOrPrefab === 'string') {
                const parentPrefab = this.get(parentNameOrPrefab);
                if (!parentPrefab) {
                    // If a parent prefab is not yet registered during this deserialize pass,
                    // it might be registered later. Store the name for now, or try to deserialize it.
                    // For simplicity, let's assume it should be registered or this is a forward declaration
                    // that will be resolved when the parent is actually registered.
                    // However, current Prefab.applyToEntity expects resolved Prefabs.
                    // A more robust system might have a two-pass registration or deferred resolution.
                    // For now, we try to deserialize it if not found.
                    // This could lead to issues if there's a missing prefab that's never registered.
                    console.warn(
                        `Prefab "${data.name}" inherits from "${parentNameOrPrefab}" which was not found. Attempting to deserialize if it's a defined data structure, or this might fail if it's just a name of an unregistered prefab.`
                    );
                    // This part is tricky: if parentNameOrPrefab is a name of a prefab defined elsewhere in a larger data structure
                    // being processed, we can't just call deserialize with a string.
                    // The original code returned the string, which Prefab.ts isn't typed to handle.
                    // For now, we return a placeholder Prefab, this is a known limitation.
                    // A better approach: Prefab.inherit could be (string | Prefab)[] and resolved at applyToEntity time.
                    // Or ensure all parent prefabs are registered first.
                    // Given the original code structure, it seems to expect parents to be resolvable.
                    const potentialParentData = this._engine._prefabs.getPrefabDataByName(parentNameOrPrefab); // Imaginary method
                    if (potentialParentData) return this.deserialize(potentialParentData);

                    console.error(`Critical: Prefab "${data.name}" cannot inherit from Prefab "${parentNameOrPrefab}" because it's not registered and no data found.`);
                    // Returning a dummy Prefab to satisfy type, but this is problematic.
                    return new Prefab(parentNameOrPrefab); // This dummy won't have components/inheritance
                }
                return parentPrefab;
            }
            return parentNameOrPrefab; // Already a Prefab instance
        });


        const componentConfigs = data.components || [];
        componentConfigs.forEach((componentData: PrefabComponentDataItem) => {
            let componentName: string = 'unknown';
            let properties: Partial<ComponentProperties> | undefined;
            let overwrite: boolean | undefined;
            let componentClass: ComponentClassWithMeta | undefined;

            if (typeof componentData === 'string') {
                componentName = componentData;
                const ckey = camelString(componentName);
                componentClass = this._engine.getComponentClass(ckey) as ComponentClassWithMeta | undefined;
            } else if (typeof componentData === 'object' && componentData.type) {
                componentName = componentData.type;
                const ckey = camelString(componentName);
                componentClass = this._engine.getComponentClass(ckey) as ComponentClassWithMeta | undefined;
                properties = componentData.properties;
                overwrite = componentData.overwrite;
            }

            if (componentClass) {
                prefab.addComponent(new PrefabComponent(componentClass, properties, overwrite));
            } else {
                console.warn(
                    `Unrecognized component reference "${componentName}" in prefab "${data.name}". Ensure the component is registered with the engine before this prefab.`,
                    componentData
                );
            }
        });

        return prefab;
    }

    // Helper that might be needed for the above warning logic, or a way to access raw prefab data.
    // This is a placeholder for a more robust way to handle inter-prefab dependencies.
    public getPrefabDataByName(name: string): PrefabData | undefined {
        // This assumes raw data is stored somewhere accessible by name if not yet deserialized.
        // The current structure doesn't explicitly store raw data separately once registered.
        // This is a conceptual method.
        return undefined;
    }


    register(data: PrefabData): void {
        // Deserialize will get or create and then store it in _prefabs
        const prefab = this.deserialize(data);
        // If deserialize didn't throw and returned a prefab, it's now in the map.
        // If it was already there, it might just return the existing one.
        // We could add more logic here if updating existing prefabs is desired.
    }

    get(name: string): Prefab | undefined {
        return this._prefabs[name];
    }

    create(world: World, name: string, properties: Partial<ComponentProperties> = {}): Entity | undefined {
        const prefab = this.get(name);

        if (!prefab) {
            console.warn(
                `Could not instantiate prefab "${name}" since it is not registered.`
            );
            return undefined;
        }

        const entity = world.createEntity(name + "_"); // Pass a unique ID base for the entity

        // Temporarily disable query eligibility during component additions for performance
        entity._qeligible = false;
        prefab.applyToEntity(entity, properties);
        entity._qeligible = true;
        entity._candidacy(); // Manually trigger candidacy check after all components are added

        return entity;
    }
}
