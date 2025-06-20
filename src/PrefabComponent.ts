import merge from 'deepmerge';
import type { Entity } from './Entity';
import type { Component } from './Component';
import type { ComponentProperties } from './Component';

// Define a type for the component class (constructor)
// Includes properties that are dynamically added or are static on Component
export type ComponentClassWithMeta<T extends Component = Component> = (new (properties?: any) => T) & { // Added export
    allowMultiple?: boolean;
    prototype: {
        _ckey: string;
        // _cbit might also be here if needed
    };
    // keyProperty?: string | null; // If needed
};

export default class PrefabComponent {
    componentClass: ComponentClassWithMeta;
    properties: Partial<ComponentProperties>; // Properties to initialize the component with
    overwrite: boolean; // Whether to overwrite an existing component if not allowMultiple

    constructor(
        clazz: ComponentClassWithMeta,
        properties: Partial<ComponentProperties> = {},
        overwrite: boolean = true
    ) {
        this.componentClass = clazz;
        this.properties = properties;
        this.overwrite = overwrite;
    }

    applyToEntity(entity: Entity, initialProps: Partial<ComponentProperties> = {}): void {
        const targetClass = this.componentClass;

        if (!targetClass.allowMultiple && entity.has(targetClass)) {
            if (!this.overwrite) {
                return; // Don't overwrite, and component already exists
            }

            // Component exists and we need to overwrite it (or it's a single-instance component)
            // We need to get the existing component instance to remove it.
            // The entity stores components by their _ckey.
            const existingComponentInstance = entity[targetClass.prototype._ckey] as Component | undefined;
            if (existingComponentInstance) {
                entity.remove(existingComponentInstance as Component & { _ckey: string, _cbit: bigint, keyProperty: string | null, allowMultiple: boolean, _onDestroyed: () => void });
            }
        }

        // Merge prefab-defined properties with any instance-specific initial properties
        // initialProps take precedence if there are clashes, due to typical merge behavior.
        // For deep merge, if this.properties has {a:1, b:1} and initialProps has {b:2, c:2}, result is {a:1, b:2, c:2}
        const finalProps = merge(this.properties, initialProps);

        entity.add(targetClass, finalProps);
    }
}
