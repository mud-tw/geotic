import merge from 'deepmerge';
import type { Entity } from './Entity';
import type { Component } from './Component';
import type { ComponentProperties } from './Component';

/**
 * Type definition for a Component class constructor, augmented with metadata
 * relevant for prefab processing. This includes static properties like `allowMultiple`
 * and prototype properties like `_ckey` (component key).
 * @template T The type of the component.
 */
export type ComponentClassWithMeta<T extends Component = Component> = (new (properties?: any) => T) & {
    /** Static property from Component: Indicates if multiple instances are allowed. */
    allowMultiple?: boolean;
    /** Prototype property: The unique key (camelCased name) of the component type. */
    prototype: {
        _ckey: string;
        // _cbit might also be relevant if prefab logic needed to interact with bitmasks directly.
    };
    // keyProperty?: string | null; // Static keyProperty if needed for more complex prefab logic.
};

/**
 * Represents a single component's definition within a Prefab.
 * It holds the component class to be instantiated, its default properties for the prefab,
 * and an overwrite flag.
 *
 * Relationships:
 * - Owned by a `Prefab` instance.
 * - Operates on an `Entity` to add a component instance to it.
 * - Uses a `ComponentClassWithMeta` (component constructor with metadata).
 */
export default class PrefabComponent {
    /** The component class (constructor) to be instantiated. */
    componentClass: ComponentClassWithMeta;
    /** Default properties to initialize this component with when the prefab is instantiated. */
    properties: Partial<ComponentProperties>;
    /**
     * If true (default), and if the component type does not allow multiple instances (`allowMultiple` is false),
     * an existing component of the same type on the entity will be removed before this one is added.
     * If false, and the component exists, this prefab component will not be applied.
     */
    overwrite: boolean;

    /**
     * Creates a new PrefabComponent definition.
     * @param clazz The component class constructor (must include metadata like `_ckey` and `allowMultiple`).
     * @param properties Default properties for this component within the prefab.
     * @param overwrite Whether to overwrite an existing single-instance component (defaults to true).
     */
    constructor(
        clazz: ComponentClassWithMeta,
        properties: Partial<ComponentProperties> = {},
        overwrite: boolean = true
    ) {
        this.componentClass = clazz;
        this.properties = properties;
        this.overwrite = overwrite;
    }

    /**
     * Applies this prefab component definition to a given entity.
     * This involves:
     * 1. Handling the `overwrite` logic for single-instance components.
     * 2. Merging the prefab's default properties for this component with any `initialProps`
     *    passed during prefab instantiation (e.g., `world.createPrefab('MyPrefab', { position: { x: 10 } })`).
     * 3. Adding a new instance of the component to the entity with the final merged properties.
     *
     * @param entity The entity to which this component should be added.
     * @param initialProps Instance-specific properties that override the prefab's defaults for this component.
     *                     These typically come from the `properties` argument of `world.createPrefab()`.
     */
    applyToEntity(entity: Entity, initialProps: Partial<ComponentProperties> = {}): void {
        const targetClass = this.componentClass;

        // Handle overwrite logic for single-instance components
        if (!targetClass.allowMultiple && entity.has(targetClass)) {
            if (!this.overwrite) {
                // If overwrite is false and the component already exists, do nothing.
                return;
            }

            // Component exists, is single-instance, and we need to overwrite it.
            // Retrieve the existing component instance by its _ckey to remove it.
            // Note: `entity[targetClass.prototype._ckey]` provides direct access to the component instance.
            const existingComponentInstance = entity[targetClass.prototype._ckey] as Component | undefined;
            if (existingComponentInstance) {
                // Cast to full type for `entity.remove`. This is a bit of a type gymnastics
                // due to the dynamic nature of component properties on Entity.
                entity.remove(existingComponentInstance as Component & { _ckey: string, _cbit: bigint, keyProperty: string | null, allowMultiple: boolean, _onDestroyed: () => void });
            }
        }

        // Merge the base properties defined in the prefab for this component
        // with any instance-specific initial properties provided during `createPrefab`.
        // `initialProps` (instance-specific) take precedence over `this.properties` (prefab defaults).
        const finalProps = merge(this.properties, initialProps);

        // Add the component to the entity with the final calculated properties.
        entity.add(targetClass, finalProps);
    }
}
