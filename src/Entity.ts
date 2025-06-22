import { Component } from './Component';
import { EntityEvent } from './EntityEvent';
import { addBit, hasBit, subtractBit } from './util/bit-util';
import type { World } from './World';
import type { ComponentProperties } from './Component';

/**
 * Defines the type for a component class constructor.
 * This is used to instantiate components when adding them to an entity.
 * @template T The type of the component, defaulting to `Component`.
 */
type ComponentClass<T extends Component = Component> = new (properties?: any) => T;

// Type of the static 'properties' field on a Component Class
// (e.g., typeof PositionComponent.properties)
type StaticPropertiesType<C extends typeof Component> = C['properties'];

// Conditional type for the 'properties' argument in the 'add' method.
// If the component's constructor's first parameter type is exactly Partial<ComponentProperties> | undefined
// (meaning it's likely using the generic base Component constructor signature without specific props typing),
// then infer the allowed properties shape from the component's static 'properties' object.
// Otherwise (if the constructor has a more specific props type), use that specific type.
// This aims to provide stricter typing based on static `properties` when the constructor is generic.
type AddPropertiesArg<Cls extends typeof Component> =
    ConstructorParameters<Cls>[0] extends (Partial<ComponentProperties> | undefined) // Check if constructor param is the generic one from base Component
    ? (
        // If the constructor truly takes NO arguments (e.g. new C1()), then allow Partial<StaticProps>.
        // If constructor takes (Partial<ComponentProperties> | undefined), also allow Partial<StaticProps>.
        // This condition needs to be robust. Let's simplify: if constructor param is too generic, rely on static.
        // A more direct check: if ConstructorParameters<Cls>[0] is *exactly* Partial<ComponentProperties> or undefined,
        // then it's the base. But type system might make this hard.
        // Simpler: If constructor first arg is assignable to Partial<ComponentProperties> (could be more specific too)
        // AND not more specific than Partial<ComponentProperties> (this is hard to check directly)
        // Let's try a refined approach: prioritize constructor args if they are more specific than just ComponentProperties
        // This was the original logic that seemed to work in thought experiment:
        ConstructorParameters<Cls>[0] extends Partial<ComponentProperties> | undefined
        ? Partial<StaticPropertiesType<Cls>> // If constructor is generic, use static properties shape
        : Partial<ConstructorParameters<Cls>[0]> // Otherwise, use constructor param shape (already good)
    )
    : Partial<ConstructorParameters<Cls>[0]>; // Fallback for non-component constructors (should not happen here)


/**
 * Defines the storage structure for components on an entity.
 * A component key can map to a single component instance, an array of instances (for `allowMultiple`),
 * or an object of instances (for `allowMultiple` with `keyProperty`).
 */
type EntityComponentStorage = Component | Component[] | { [key: string]: Component };

/**
 * Represents the collection of all components attached to an entity,
 * where keys are component type names (ckeys).
 */
interface EntityComponents {
    [key: string]: EntityComponentStorage;
}

// Helper functions with types (internal to Entity module)

/** @private Attaches a single-instance component to the entity. */
const attachComponent = (entity: Entity, component: Component & { _ckey: string }): void => {
    const key = component._ckey;
    (entity as any)[key] = component; // Direct access property (e.g., entity.position)
    entity.components[key] = component; // Stored in the main components map
};

/** @private Attaches a multi-instance component that is keyed by one of its properties. */
const attachComponentKeyed = (entity: Entity, component: Component & { _ckey: string, keyProperty: string | null, [key: string]: any }): void => {
    const key = component._ckey; // Component type key (e.g., "equipmentSlot")
    if (!component.keyProperty) return; // Should not happen if called correctly

    // Initialize storage if it doesn't exist for this component type
    if (!entity.components[key]) {
        (entity as any)[key] = {};
        entity.components[key] = {};
    }
    const componentMap = entity.components[key] as { [key: string]: Component };
    const instanceKey = component[component.keyProperty!]; // Value of the keyProperty (e.g., "head")
    componentMap[instanceKey] = component;
    (entity as any)[key][instanceKey] = component; // e.g., entity.equipmentSlot.head
};

/** @private Attaches a multi-instance component that is stored as an array. */
const attachComponentArray = (entity: Entity, component: Component & { _ckey: string }): void => {
    const key = component._ckey;

    // Initialize storage if it doesn't exist
    if (!entity.components[key]) {
        (entity as any)[key] = [];
        entity.components[key] = [];
    }
    const componentArray = entity.components[key] as Component[];
    componentArray.push(component);
    ((entity as any)[key] as Component[]).push(component); // e.g., entity.impulses.push(...)
};

/** @private Removes a single-instance component from the entity. */
const removeComponent = (entity: Entity, component: Component & { _ckey: string, _cbit: bigint }): void => {
    const key = component._ckey;

    delete (entity as any)[key];
    delete entity.components[key];

    entity._cbits = subtractBit(entity._cbits, component._cbit); // Update bitmask
    entity._candidacy(); // Notify world/queries
};

/** @private Removes a specific instance of a keyed multi-component. */
const removeComponentKeyed = (entity: Entity, component: Component & { _ckey: string, _cbit: bigint, keyProperty: string | null, [key: string]: any }): void => {
    if (!component.keyProperty) return;
    const key = component._ckey;
    const keyPropValue = component[component.keyProperty!];

    const entityKeyedComponents = (entity as any)[key] as { [key: string]: Component };
    const componentsMap = entity.components[key] as { [key: string]: Component };

    if (entityKeyedComponents) delete entityKeyedComponents[keyPropValue];
    if (componentsMap) delete componentsMap[keyPropValue];

    // If this was the last component of this type, remove the bitmask and the main storage
    if (componentsMap && Object.keys(componentsMap).length <= 0) {
        delete (entity as any)[key];
        delete entity.components[key];
        entity._cbits = subtractBit(entity._cbits, component._cbit);
        entity._candidacy();
    }
};

/** @private Removes a specific instance of an array-based multi-component. */
const removeComponentArray = (entity: Entity, component: Component & { _ckey: string, _cbit: bigint }): void => {
    const key = component._ckey;
    const entityComponentArray = (entity as any)[key] as Component[];
    const componentsArray = entity.components[key] as Component[];

    if (entityComponentArray) {
        const idx = entityComponentArray.indexOf(component);
        if (idx !== -1) entityComponentArray.splice(idx, 1);
    }
    if (componentsArray) {
        const idx = componentsArray.indexOf(component);
        if (idx !== -1) componentsArray.splice(idx, 1);
    }

    // If this was the last component of this type, remove the bitmask and the main storage
    if (componentsArray && componentsArray.length <= 0) {
        delete (entity as any)[key];
        delete entity.components[key];
        entity._cbits = subtractBit(entity._cbits, component._cbit);
        entity._candidacy();
    }
};

/** @private Serializes a single component instance. */
const serializeComponent = (component: Component): ComponentProperties => {
    return component.serialize();
};

/** @private Serializes an array of component instances. */
const serializeComponentArray = (arr: Component[]): ComponentProperties[] => {
    return arr.map(serializeComponent);
};

/** @private Serializes a map (object) of keyed component instances. */
const serializeComponentKeyed = (ob: { [key: string]: Component }): { [key: string]: ComponentProperties } => {
    const ser: { [key: string]: ComponentProperties } = {};
    for (const k in ob) {
        ser[k] = serializeComponent(ob[k]);
    }
    return ser;
};

/**
 * Defines the structure for a serialized entity, including its ID and a map of its component data.
 * The component data can be single properties objects, arrays of them, or maps of them.
 */
export interface SerializedEntity {
    id: string;
    [componentKey: string]: any;
}

/**
 * An Entity represents a single "thing" in the game or simulation.
 * It is primarily a container for Components, which define its data and behavior.
 * Entities themselves have no data or behavior other than managing their components.
 *
 * Relationships:
 * - Belongs to a `World`.
 * - Holds a collection of `Component` instances.
 * - Interacts with its `World` to notify about composition changes (for `Query` updates)
 *   and its own destruction.
 *
 * Key Properties:
 * - `id`: A unique identifier.
 * - `world`: The world this entity lives in.
 * - `components`: A map storing all attached component instances.
 * - `_cbits`: A bitmask representing the set of component types attached, used for efficient querying.
 * - `isDestroyed`: A flag indicating if the entity has been destroyed.
 */
export class Entity {
    /** The World instance this entity belongs to. */
    world: World;
    /** The unique identifier for this entity. */
    id: string;
    /**
     * A map holding all component instances attached to this entity.
     * Keys are component type names (ckeys), values can be single components,
     * arrays of components, or objects of keyed components.
     */
    components: EntityComponents;
    /** Flag indicating whether this entity has been destroyed. */
    isDestroyed: boolean;
    /**
     * @private Bitmask representing the types of components attached to this entity.
     * Each bit corresponds to a registered component type. Used for fast query matching.
     */
    _cbits: bigint = 0n;
    /**
     * @private Flag indicating if this entity is eligible for query candidacy checks.
     * Used to temporarily disable candidacy checks during bulk operations like deserialization
     * or prefab instantiation for performance.
     */
    _qeligible: boolean = true;

    /**
     * Allows dynamic property access for components (e.g., `entity.position`).
     * TypeScript uses an index signature for this.
     */
    [key: string]: any;

    /**
     * Creates a new Entity instance.
     * Typically called by `World.createEntity()`.
     * @param world The world this entity will belong to.
     * @param id The unique ID for this entity.
     */
    constructor(world: World, id: string) {
        this.world = world;
        this.id = id;
        this.components = {};
        this.isDestroyed = false;
    }

    /**
     * @private Notifies the world that this entity's component composition might have changed.
     * This triggers queries to re-evaluate if this entity matches their criteria.
     * Only proceeds if `_qeligible` is true.
     */
    _candidacy(): void {
        if (this._qeligible) {
            this.world.entityCompositionChanged(this);
        }
    }

    /**
     * Adds a component of the given class to this entity.
     * @template T The type of the component to add.
     * @param clazz The component class constructor.
     * @param properties Optional initial properties for the component instance.
     *                   These will override the component's static default properties.
     *
     * Steps:
     * 1. Creates a new instance of the component class.
     * 2. Attaches the component to the entity (handles single, array, or keyed storage).
     * 3. Updates the entity's component bitmask (`_cbits`).
     * 4. Calls the component's `_onAttached` lifecycle method.
     * 5. Notifies the world of the composition change (`_candidacy`).
     */
    add<T extends Component>(
        // Ensure clazz is a type that extends Component constructor and has static 'properties'
        clazz: (new (...args: any[]) => T) & typeof Component,
        properties?: AddPropertiesArg<typeof clazz>
    ): void {
        // The `as any` casts here are to work around complex typings with mixed-in properties like _ckey, _cbit.
        const component = new clazz(properties) as T & { _ckey: string, _cbit: bigint, keyProperty: string | null, allowMultiple: boolean, _onAttached: (entity: Entity) => void };

        // Determine how to store the component based on its static properties
        if (component.keyProperty) { // Keyed multi-component (e.g., EquipmentSlot 'head')
            attachComponentKeyed(this, component);
        } else if (component.allowMultiple) { // Array-based multi-component (e.g., list of Impulses)
            attachComponentArray(this, component);
        } else { // Single instance component (e.g., Position)
            attachComponent(this, component);
        }

        this._cbits = addBit(this._cbits, component._cbit); // Update bitmask
        component._onAttached(this); // Call lifecycle hook

        this._candidacy(); // Notify world/queries
    }

    /**
     * Checks if the entity has a component of the given class.
     * Uses the entity's component bitmask for efficient checking.
     * @template T The type of the component to check for.
     * @param componentClass The component class constructor.
     * @returns `true` if the entity has the component, `false` otherwise.
     */
    has<T extends Component>(componentClass: ComponentClass<T>): boolean {
        // _cbit is set on the component class's prototype during registration.
        return hasBit(this._cbits, (componentClass.prototype as any)._cbit);
    }

    /**
     * Retrieves a component instance of the given class from this entity.
     * This method is primarily for single-instance components. For multi-instance components,
     * direct property access (e.g., `entity.myComponentsArray`) or more specific getters
     * (like `getAll`, `getByKey` if implemented) should be used.
     * @template T The type of the component to retrieve.
     * @param componentClass The component class constructor.
     * @returns The component instance if found and it's a single instance, otherwise `undefined`.
     */
    get<T extends Component>(componentClass: ComponentClass<T>): T | undefined {
        // _ckey is set on the component class's prototype during registration.
        const componentKey = (componentClass.prototype as any)._ckey;
        if (!componentKey) {
            // console.warn(`Component ${componentClass.name} does not have a _ckey or is not registered.`);
            return undefined;
        }

        const componentInstance = this.components[componentKey];

        // This basic 'get' assumes retrieval of a single component instance.
        // It checks if the stored instance is indeed an instance of the requested class.
        // It does not directly handle array/map results from allowMultiple components.
        if (componentInstance instanceof componentClass) {
            return componentInstance as T;
        }
        return undefined;
    }

    /**
     * Removes a component instance from this entity.
     * @param component The specific component instance to remove.
     *
     * Steps:
     * 1. Determines how the component is stored (single, array, or keyed) based on its static properties.
     * 2. Removes the component from the entity's storage.
     * 3. If it's the last component of its type, updates the entity's bitmask (`_cbits`).
     * 4. Calls the component's `_onDestroyed` lifecycle method.
     * 5. Notifies the world of the composition change (`_candidacy`).
     */
    remove(component: Component & { _ckey: string, _cbit: bigint, _onDestroyed: () => void }): void {
        const staticProps = component.constructor as typeof Component; // Access static props like allowMultiple

        if (staticProps.keyProperty) {
            removeComponentKeyed(this, component as any); // Cast due to complex internal types
        } else if (staticProps.allowMultiple) {
            removeComponentArray(this, component);
        } else {
            removeComponent(this, component);
        }
        component._onDestroyed(); // Call lifecycle hook
    }

    /**
     * Destroys this entity.
     * This removes all attached components, notifies the world to remove the entity,
     * and marks the entity as destroyed.
     *
     * Steps:
     * 1. Iterate through all components currently attached.
     * 2. For each component (or collection of components if `allowMultiple`):
     *    a. Call its `_onDestroyed` lifecycle method.
     *    b. Remove it from the entity's internal storage and direct access properties.
     *    c. Update the entity's component bitmask (`_cbits`) by subtracting the component's bit.
     * 3. Clear the entity's `components` map.
     * 4. Notify the world that the entity's composition has effectively become empty (`world.entityCompositionChanged`).
     * 5. Notify the world that this entity instance is being destroyed (`world.entityWasDestroyed`).
     * 6. Set the `isDestroyed` flag to `true`.
     */
    destroy(): void {
        if (this.isDestroyed) return; // Already destroyed

        // Iterate over a copy of keys, as removing components can modify this.components
        const componentKeys = Object.keys(this.components);

        for (const k of componentKeys) {
            const v = this.components[k]; // v is component instance, array, or map

            if (v instanceof Component) {
                this._cbits = subtractBit(this._cbits, v._cbit);
                (v as any)._onDestroyed();
            } else if (Array.isArray(v)) {
                for (const component of v) {
                    // Assuming all components in the array share the same _cbit if they are of the same type.
                    // If an entity could have multiple *types* of components that are allowMultiple=true and not keyed,
                    // this logic might need refinement, but typically allowMultiple refers to multiple instances of *one* type.
                    // For now, this assumes the first component's _cbit is representative if the array becomes empty.
                    // A more robust way would be to only subtract the bit if this.components[k] becomes empty.
                    // However, the current removeComponentArray/Keyed handles bit subtraction when the collection is empty.
                    // Here, we are forcefully destroying all, so we subtract for each distinct type.
                    // The primary bit subtraction occurs when the component's collection (array/map) becomes empty.
                    // During a full entity destroy, we ensure all bits are cleared.
                    // Let's assume the first component's cbit is representative for the type.
                    if (v.length > 0) this._cbits = subtractBit(this._cbits, v[0]._cbit);
                    component._onDestroyed();
                }
            } else if (typeof v === 'object' && v !== null) { // Keyed components
                const componentValues = Object.values(v as object);
                if (componentValues.length > 0 && componentValues[0] instanceof Component) {
                     this._cbits = subtractBit(this._cbits, (componentValues[0] as Component)._cbit);
                }
                for (const component of componentValues) {
                    (component as Component)._onDestroyed();
                }
            }
            delete (this as any)[k]; // Remove direct access property (e.g., entity.position)
            // Deleting from this.components happens after loop or by clearing this.components
        }

        this.components = {}; // Clear all component storage
        this._cbits = 0n; // All components are gone, so clear all bits

        // Notify queries that this entity (now empty of components) might no longer match.
        // This is important for queries to update their caches.
        this.world.entityCompositionChanged(this);
    
        // Notify the World that this entity is being removed from active existence.
        this.world.entityWasDestroyed(this.id);
    
        this.isDestroyed = true;
    }

    /**
     * Serializes this entity and its components into a JSON-compatible object.
     * Only properties defined in each component's `static properties` are serialized.
     * @returns A `SerializedEntity` object.
     */
    serialize(): SerializedEntity {
        const serializedComponents: { [key: string]: any } = {};

        for (const k in this.components) {
            const v = this.components[k];

            if (v instanceof Component) {
                serializedComponents[k] = serializeComponent(v);
            } else if (Array.isArray(v)) {
                serializedComponents[k] = serializeComponentArray(v);
            } else { // Object for keyed components
                serializedComponents[k] = serializeComponentKeyed(v as { [key: string]: Component });
            }
        }

        return {
            id: this.id,
            ...serializedComponents,
        };
    }

    /**
     * Clones this entity.
     * This creates a new entity with a new ID but with identical components and properties.
     * Delegates to `world.cloneEntity()`.
     * @returns The new, cloned Entity instance.
     */
    clone(): Entity {
        return this.world.cloneEntity(this);
    }

    /**
     * Fires an event on this entity, dispatching it to all attached components.
     * Components can handle the event and prevent its propagation to other components.
     * Event handler methods on components are typically named `on[EventName]` (e.g., `onTakeDamage`).
     * @param name The name of the event (e.g., "take-damage").
     * @param data Optional data payload for the event.
     * @returns The `EntityEvent` instance after it has been processed by components.
     */
    fireEvent(name: string, data?: any): EntityEvent {
        const evt = new EntityEvent(name, data);
        evt.entity = this; // Associate the event with this entity

        // Iterate through component types attached to this entity
        for (const key in this.components) {
            if (evt.prevented) break; // Stop if event propagation was prevented

            const componentStorage = this.components[key];

            if (componentStorage instanceof Component) {
                (componentStorage as any)._onEvent(evt); // Dispatch to single component
            } else if (Array.isArray(componentStorage)) {
                for (let i = 0; i < componentStorage.length; i++) { // Dispatch to each component in array
                    (componentStorage[i] as any)._onEvent(evt);
                    if (evt.prevented) break;
                }
            } else if (typeof componentStorage === 'object' && componentStorage !== null) { // Dispatch to each component in map
                for (const component of Object.values(componentStorage)) {
                    (component as any)._onEvent(evt);
                    if (evt.prevented) break;
                }
            }
        }
        return evt;
    }
}
