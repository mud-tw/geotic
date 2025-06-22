import type { Entity } from './Entity';
import type PrefabComponent from './PrefabComponent';
import type { Component, ComponentProperties } from './Component'; // Added ComponentProperties

/**
 * Defines the structure for properties that can be passed during prefab instantiation
 * to override default component values.
 * Keys are component type names (ckeys), and values can be:
 * - An object of properties for a single-instance component (e.g., `{ x: 10, y: 20 }` for Position).
 * - An object mapping keys to property objects for keyed multi-components
 *   (e.g., `{ head: { itemId: 'helmet1' }, body: { itemId: 'armor1' } }` for EquipmentSlot).
 * - An array of property objects for array-based multi-components (though less common for direct override).
 * - Individual property values if flat overrides are supported for single components (e.g. `x: 100` if `Position` is the only component with `x`).
 */
interface PrefabInstantiationProperties {
    [componentKey: string]: any;
}

/**
 * A Prefab is a template for creating entities with a predefined set of components and properties.
 * Prefabs can inherit from other prefabs, allowing for complex entity hierarchies and reuse.
 *
 * Relationships:
 * - Managed by a `PrefabRegistry` (which is part of an `Engine`).
 * - Composed of multiple `PrefabComponent` definitions.
 * - Can `inherit` from other `Prefab` instances.
 * - `applyToEntity` method is used to configure an `Entity` instance.
 *
 * Instantiation Process (`applyToEntity`):
 * 1. Recursively applies parent prefabs first. This means components from parent prefabs are added
 *    before components from the current prefab. Overwrite logic in `PrefabComponent` handles
 *    how child prefab components interact with parent components of the same type.
 * 2. Iterates through its own `PrefabComponent` definitions.
 * 3. For each `PrefabComponent`, it determines the final properties to apply:
 *    a. It considers "flat" overrides from `prefabProps` (the properties passed to `world.createPrefab`).
 *       These are top-level properties in `prefabProps` that match property names within a
 *       single-instance component's schema (e.g., if `prefabProps = { x: 100 }` and a `Position`
 *       component is being applied). This is a convenience for overriding simple, uniquely named properties.
 *    b. It considers "structured" overrides from `prefabProps`. These are nested objects where the key
 *       is the component's `_ckey` (e.g., `prefabProps = { position: { x: 50 } }`).
 *       For keyed multi-components, it looks up `prefabProps[ckey][instanceKey]`.
 *       For array multi-components, it looks up `prefabProps[ckey][index]`.
 *    c. Structured overrides take precedence over flat overrides.
 * 4. Calls `prefabComponent.applyToEntity(entity, finalCalculatedProps)` for each component definition.
 */
export default class Prefab {
    /** The unique name of this prefab. */
    name: string;
    /**
     * An array of `Prefab` instances from which this prefab inherits.
     * When applying this prefab, parent prefabs are applied first.
     * This array is populated by the `PrefabRegistry` during deserialization.
     */
    inherit: Prefab[] = [];
    /** An array of `PrefabComponent` definitions that make up this prefab. */
    components: PrefabComponent[] = [];

    /**
     * Creates a new Prefab instance.
     * @param name The name of the prefab.
     */
    constructor(name: string) {
        this.name = name;
    }

    /**
     * Adds a component definition (a `PrefabComponent`) to this prefab.
     * @param prefabComponent The `PrefabComponent` to add.
     */
    addComponent(prefabComponent: PrefabComponent): void {
        this.components.push(prefabComponent);
    }

    /**
     * Applies this prefab's configuration (and its inherited ones) to a given entity.
     *
     * @param entity The entity to apply the prefab configuration to.
     * @param prefabInstantiationProps Properties passed during prefab instantiation (e.g., from `world.createPrefab(name, props)`).
     *                               These can override default values from the prefab definition.
     * @returns The configured entity.
     */
    applyToEntity(entity: Entity, prefabInstantiationProps: PrefabInstantiationProperties = {}): Entity {
        // 1. Apply parent prefabs first (recursively).
        // Properties passed to the child's instantiation might also apply to parent components
        // if their structure matches.
        this.inherit.forEach((parentPrefab: Prefab) => {
            parentPrefab.applyToEntity(entity, prefabInstantiationProps);
        });

        // Counter for array-based multiple components to pick the correct override from prefabInstantiationProps.
        const arrCompsCounter: { [ckey: string]: number } = {};

        // 2. Apply components defined directly in this prefab.
        this.components.forEach((pComponent: PrefabComponent) => {
            // Get the component class and its ckey (e.g., "position")
            const componentClass = pComponent.componentClass; // Already has ComponentClassWithMeta type
            const ckey = componentClass.prototype._ckey;

            let propsForThisComponentInstance: Partial<ComponentProperties> = {};

            // A. Gather "flat" property overrides from prefabInstantiationProps.
            // These are top-level properties in prefabInstantiationProps (e.g., { x: 100, y: 50 })
            // that match property names in the schema of a single-instance component.
            // This is a convenience for simple overrides.
            const componentSchema = (componentClass as any).properties || {}; // Static properties of the component
            const flatOverrides: Partial<ComponentProperties> = {};
            if (!componentClass.allowMultiple) { // Flat overrides make most sense for single-instance components
                for (const propName in prefabInstantiationProps) {
                    if (componentSchema.hasOwnProperty(propName) && !(propName in propsForThisComponentInstance)) {
                        flatOverrides[propName] = prefabInstantiationProps[propName];
                    }
                }
            }

            // B. Gather "structured" property overrides from prefabInstantiationProps.
            // These are specified like { componentCKey: { prop1: val1 } }
            // or for keyed: { componentCKey: { instanceKey: { prop1: val1 } } }
            // or for array: { componentCKey: [ {prop1:val1}, {prop2:val2} ] }
            let structuredOverrides: Partial<ComponentProperties> = {};
            if (prefabInstantiationProps[ckey] !== undefined) { // Check if there are any overrides for this ckey
                if (componentClass.allowMultiple) {
                    const keyPropertyOnClass = (componentClass as any).keyProperty; // Static keyProperty
                    if (keyPropertyOnClass && pComponent.properties && pComponent.properties[keyPropertyOnClass] !== undefined) {
                        // Keyed multi-component (e.g., EquipmentSlot with name='head')
                        const instanceKey = pComponent.properties[keyPropertyOnClass] as string;
                        if (prefabInstantiationProps[ckey] && prefabInstantiationProps[ckey][instanceKey] !== undefined) {
                            structuredOverrides = prefabInstantiationProps[ckey][instanceKey];
                        }
                    } else {
                        // Array-based multi-component
                        const currentIndex = arrCompsCounter[ckey] || 0;
                        if (Array.isArray(prefabInstantiationProps[ckey]) && prefabInstantiationProps[ckey][currentIndex] !== undefined) {
                            structuredOverrides = prefabInstantiationProps[ckey][currentIndex];
                        }
                        arrCompsCounter[ckey] = currentIndex + 1;
                    }
                } else {
                    // Single-instance component
                    structuredOverrides = prefabInstantiationProps[ckey];
                }
            }

            // C. Merge flat and structured overrides. Structured overrides take precedence.
            // The properties from pComponent.properties (defined in the prefab data) will be merged
            // inside pComponent.applyToEntity, with these `propsForThisComponentInstance` taking precedence over them.
            propsForThisComponentInstance = { ...flatOverrides, ...structuredOverrides };

            // 3. Apply the PrefabComponent to the entity with the resolved initial properties.
            // The PrefabComponent's applyToEntity will further merge these `propsForThisComponentInstance`
            // with its own `this.properties` (from the prefab definition).
            pComponent.applyToEntity(entity, propsForThisComponentInstance);
        });

        return entity;
    }
}
