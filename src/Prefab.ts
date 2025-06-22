import type { Entity } from './Entity';
import type PrefabComponent from './PrefabComponent'; // Corrected import
import type { Component } from './Component';

// Define a type for the component class (constructor)
type ComponentClass<T extends Component = Component> = new (...args: any[]) => T;

interface PrefabProperties {
    [componentKey: string]: any; // Can be component properties or map for keyed/array components
}

export default class Prefab {
    name: string;
    inherit: Prefab[] = []; // Can be Prefab instances (resolved) or strings (unresolved)
    components: PrefabComponent[] = [];

    constructor(name: string) {
        this.name = name;
    }

    addComponent(prefabComponent: PrefabComponent): void {
        this.components.push(prefabComponent);
    }

    applyToEntity(entity: Entity, prefabProps: PrefabProperties = {}): Entity {
        this.inherit.forEach((parentPrefab: Prefab) => {
            parentPrefab.applyToEntity(entity, prefabProps);
        });

        const arrCompsCounter: { [ckey: string]: number } = {};

        this.components.forEach((pComponent: PrefabComponent) => {
            const componentClass = pComponent.componentClass as (ComponentClass<Component> & {prototype: {_ckey: string}, allowMultiple?: boolean, keyProperty?: string | null});
            const ckey = componentClass.prototype._ckey;

            let componentOverrides: Partial<ComponentProperties> = {};

            if (componentClass.allowMultiple) {
                if (componentClass.keyProperty && pComponent.properties) {
                    const keyPropName = componentClass.keyProperty;
                    const keyValue = pComponent.properties[keyPropName];

                    if (prefabProps[ckey] && prefabProps[ckey][keyValue]) {
                        componentOverrides = prefabProps[ckey][keyValue];
                    }
                } else {
                    // Non-keyed multiple components (array)
                    if (!arrCompsCounter[ckey]) {
                        arrCompsCounter[ckey] = 0;
                    }
                    const currentIndex = arrCompsCounter[ckey];
                    if (prefabProps[ckey] && Array.isArray(prefabProps[ckey]) && prefabProps[ckey][currentIndex]) {
                        componentOverrides = prefabProps[ckey][currentIndex];
                    }
                    arrCompsCounter[ckey]++;
                }
            } else {
                // Single component
                // Check for structured override first (e.g., { posComponent: { x: 100 } })
                if (prefabProps[ckey]) {
                    componentOverrides = prefabProps[ckey];
                } else {
                    // If no structured override, try to apply flat properties (e.g., { x: 100 })
                    // This applies only to single-instance components to avoid ambiguity.
                    // Iterate over properties defined in the component's static 'properties'
                    // and check if they exist in the flat prefabProps.
                    const staticComponentProps = (componentClass as any).properties || {};
                    for (const propName in staticComponentProps) {
                        if (prefabProps.hasOwnProperty(propName)) {
                            componentOverrides[propName] = prefabProps[propName];
                        }
                    }
                }
            }
            pComponent.applyToEntity(entity, componentOverrides);
        });

        return entity;
    }
}
