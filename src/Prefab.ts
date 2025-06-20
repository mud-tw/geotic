import type { Entity } from './Entity.js';
import type PrefabComponent from './PrefabComponent.js'; // Corrected import
import type { Component } from './Component.js';

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

            let initialCompProps: any = {}; // TODO: Type this better based on component properties

            if (componentClass.allowMultiple) {
                if (componentClass.keyProperty && pComponent.properties) {
                    const keyPropName = componentClass.keyProperty;
                    const keyValue = pComponent.properties[keyPropName];

                    if (prefabProps[ckey] && prefabProps[ckey][keyValue]) {
                        initialCompProps = prefabProps[ckey][keyValue];
                    }
                } else {
                    // Non-keyed multiple components (array)
                    if (!arrCompsCounter[ckey]) {
                        arrCompsCounter[ckey] = 0;
                    }
                    const currentIndex = arrCompsCounter[ckey];
                    if (prefabProps[ckey] && Array.isArray(prefabProps[ckey]) && prefabProps[ckey][currentIndex]) {
                        initialCompProps = prefabProps[ckey][currentIndex];
                    }
                    arrCompsCounter[ckey]++;
                }
            } else {
                // Single component
                if (prefabProps[ckey]) {
                    initialCompProps = prefabProps[ckey];
                }
            }
            pComponent.applyToEntity(entity, initialCompProps);
        });

        return entity;
    }
}
