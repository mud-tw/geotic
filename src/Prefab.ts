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

            let initialCompProps: any = {};

            // 1. 收集與此組件 schema 匹配的扁平屬性覆蓋。
            // 這允許直接傳遞 { x: 100 } 來覆蓋單一組件的屬性。
            const componentSchema = (componentClass as any).properties || {};
            const flatOverrides: any = {};
            if (!componentClass.allowMultiple) { // 扁平覆蓋僅對單一實例組件有意義
                for (const propName in prefabProps) {
                    if (componentSchema.hasOwnProperty(propName)) {
                        flatOverrides[propName] = prefabProps[propName];
                    }
                }
            }

            // 2. 獲取結構化的屬性覆蓋 (例如 { posComponent: { x: 100 } })
            let structuredOverrides: any = {};

            if (componentClass.allowMultiple) {
                if (componentClass.keyProperty && pComponent.properties) {
                    const keyPropName = componentClass.keyProperty;
                    const keyValue = pComponent.properties[keyPropName];

                    if (prefabProps[ckey] && prefabProps[ckey][keyValue]) {
                        structuredOverrides = prefabProps[ckey][keyValue];
                    }
                } else {
                    // Non-keyed multiple components (array)
                    if (!arrCompsCounter[ckey]) arrCompsCounter[ckey] = 0;
                    const currentIndex = arrCompsCounter[ckey];
                    if (prefabProps[ckey] && Array.isArray(prefabProps[ckey]) && prefabProps[ckey][currentIndex]) {
                        structuredOverrides = prefabProps[ckey][currentIndex];
                    }
                    arrCompsCounter[ckey]++;
                }
            } else {
                // Single component
                if (prefabProps[ckey]) structuredOverrides = prefabProps[ckey];
            }

            // 3. 合併它們。結構化覆蓋應優先於扁平覆蓋。
            initialCompProps = { ...flatOverrides, ...structuredOverrides };

            pComponent.applyToEntity(entity, initialCompProps);
        });

        return entity;
    }
}
