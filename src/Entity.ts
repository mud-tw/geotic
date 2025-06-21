import { Component } from './Component';
import { EntityEvent } from './EntityEvent';
import { addBit, hasBit, subtractBit } from './util/bit-util';
import type { World } from './World';
import type { ComponentProperties } from './Component'; // Assuming Component.ts exports this

// Define a type for the component class (constructor)
type ComponentClass<T extends Component = Component> = new (properties?: any) => T;

// Type for the components property on an Entity
// It can hold single components, arrays of components, or maps of components (keyed by a property)
type EntityComponentStorage = Component | Component[] | { [key: string]: Component };
interface EntityComponents {
    [key: string]: EntityComponentStorage;
}

// Helper functions with types
const attachComponent = (entity: Entity, component: Component & { _ckey: string }): void => {
    const key = component._ckey;
    (entity as any)[key] = component;
    entity.components[key] = component;
};

const attachComponentKeyed = (entity: Entity, component: Component & { _ckey: string, keyProperty: string | null, [key: string]: any }): void => {
    const key = component._ckey;
    if (!component.keyProperty) return; // Should not happen if called correctly

    if (!entity.components[key]) {
        (entity as any)[key] = {};
        entity.components[key] = {};
    }
    const componentMap = entity.components[key] as { [key: string]: Component };
    componentMap[component[component.keyProperty!]] = component;
    entity[key][component[component.keyProperty!]] = component;
};

const attachComponentArray = (entity: Entity, component: Component & { _ckey: string }): void => {
    const key = component._ckey;

    if (!entity.components[key]) {
        (entity as any)[key] = [];
        entity.components[key] = [];
    }
    const componentArray = entity.components[key] as Component[];
    componentArray.push(component);
    (entity[key] as Component[]).push(component);
};

const removeComponent = (entity: Entity, component: Component & { _ckey: string, _cbit: bigint }): void => {
    const key = component._ckey;

    delete (entity as any)[key];
    delete entity.components[key];

    entity._cbits = subtractBit(entity._cbits, component._cbit);
    entity._candidacy();
};

const removeComponentKeyed = (entity: Entity, component: Component & { _ckey: string, _cbit: bigint, keyProperty: string | null, [key: string]: any }): void => {
    if (!component.keyProperty) return;
    const key = component._ckey;
    const keyPropValue = component[component.keyProperty!];

    const entityKeyedComponents = (entity as any)[key] as { [key: string]: Component };
    const componentsMap = entity.components[key] as { [key: string]: Component };

    if (entityKeyedComponents) delete entityKeyedComponents[keyPropValue];
    if (componentsMap) delete componentsMap[keyPropValue];


    if (componentsMap && Object.keys(componentsMap).length <= 0) {
        delete (entity as any)[key];
        delete entity.components[key];
        entity._cbits = subtractBit(entity._cbits, component._cbit);
        entity._candidacy();
    }
};

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

    if (componentsArray && componentsArray.length <= 0) {
        delete (entity as any)[key];
        delete entity.components[key];
        entity._cbits = subtractBit(entity._cbits, component._cbit);
        entity._candidacy();
    }
};

const serializeComponent = (component: Component): ComponentProperties => {
    return component.serialize();
};

const serializeComponentArray = (arr: Component[]): ComponentProperties[] => {
    return arr.map(serializeComponent);
};

const serializeComponentKeyed = (ob: { [key: string]: Component }): { [key: string]: ComponentProperties } => {
    const ser: { [key: string]: ComponentProperties } = {};
    for (const k in ob) {
        ser[k] = serializeComponent(ob[k]);
    }
    return ser;
};

export interface SerializedEntity {
    id: string;
    [componentKey: string]: any; // This will be ComponentProperties, ComponentProperties[], or {[key: string]: ComponentProperties}
}

export class Entity {
    world: World;
    id: string;
    components: EntityComponents;
    isDestroyed: boolean;
    _cbits: bigint = 0n;
    _qeligible: boolean = true;
    // Allow dynamic properties for component access like entity.position
    [key: string]: any;

    constructor(world: World, id: string) {
        this.world = world;
        this.id = id;
        this.components = {};
        this.isDestroyed = false;
    }

    _candidacy(): void {
        if (this._qeligible) {
            this.world._candidate(this);
        }
    }

    add<T extends Component>(clazz: ComponentClass<T>, properties?: any): void {
        // TODO: Fix 'any' for properties, should be Partial<ConstructorParameters<typeof clazz>[0]> or similar
        const component = new clazz(properties) as T & { _ckey: string, _cbit: bigint, keyProperty: string | null, allowMultiple: boolean, _onAttached: (entity: Entity) => void };

        if (component.keyProperty) {
            attachComponentKeyed(this, component);
        } else if (component.allowMultiple) {
            attachComponentArray(this, component);
        } else {
            attachComponent(this, component);
        }

        this._cbits = addBit(this._cbits, component._cbit);
        component._onAttached(this);

        this._candidacy();
    }

    has<T extends Component>(clazz: ComponentClass<T> | (Function & { prototype: { _cbit: bigint } })): boolean {
        // The `Function & { prototype: ... }` is a bit of a hack to handle un-migrated JS classes that will have .prototype
        // but might not be true ComponentClass<T> yet.
        return hasBit(this._cbits, (clazz.prototype as any)._cbit);
    }

    remove(component: Component & { _ckey: string, _cbit: bigint, _onDestroyed: () => void }): void {
        // Access static properties from the component's constructor
        const staticProps = component.constructor as typeof Component;

        if (staticProps.keyProperty) {
            // Cast component to any for removeComponentKeyed as it expects keyProperty directly for now
            removeComponentKeyed(this, component);
        } else if (staticProps.allowMultiple) {
            removeComponentArray(this, component);
        } else {
            removeComponent(this, component);
        }
        component._onDestroyed();
    }

    /**
     * 銷毀此實體。
     * 這會移除所有附加的組件，從世界中移除此實體，並將其標記為已銷毀。
     */
    destroy(): void {
        // 1. 遍歷此實體上所有已註冊的組件
        // this.components 是一個物件，其鍵是組件的 ckey (駝峰式命名的組件類別名稱)，
        // 值可能是單個組件實例、組件實例陣列 (對於允許多個的組件) 或
        // 組件實例的物件 (對於鍵控組件)。
        for (const k in this.components) {
            const v = this.components[k]; // v 是組件實例、陣列或物件
    
            // 2. 根據組件的儲存方式處理組件的銷毀邏輯
            if (v instanceof Component) {
                // 2.1 如果 v 是一個單獨的組件實例
                // 從實體的組件位元遮罩中移除此組件的位元
                this._cbits = subtractBit(this._cbits, v._cbit);
                // 呼叫組件內部的 _onDestroyed 方法，執行組件特定的清理邏輯
                (v as any)._onDestroyed();
            } else if (Array.isArray(v)) {
                // 2.2 如果 v 是一個組件實例的陣列 (例如允許多個的組件)
                for (const component of v) {
                    // 對陣列中的每個組件執行相同的操作
                    this._cbits = subtractBit(this._cbits, component._cbit);
                    component._onDestroyed();
                }
            } else { // Object for keyed components
                // 2.3 如果 v 是一個物件，代表鍵控組件 (例如，按名稱區分的 EquipmentSlot)
                for (const component of Object.values(v)) {
                    // 對物件中的每個組件實例執行相同的操作
                    this._cbits = subtractBit(this._cbits, component._cbit);
                    component._onDestroyed();
                }
            }
            // 3. 從實體上移除對此組件(或組件集合)的直接存取屬性 (例如 entity.position)
            delete (this as any)[k];
            // 4. 從實體的內部 components 映射中移除此組件(或組件集合)
            delete this.components[k];
        }
    
        // 5. 通知查詢系統此實體的組件構成已改變 (現在是空的)
        // 這會讓查詢系統更新其快取的結果集
        this._candidacy();
    
        // 6. 通知世界 (World) 此實體已被銷毀
        // World 會將此實體從其活躍實體列表中移除
        this.world._destroyed(this.id);
    
        // 7. 清空實體的 components 映射
        this.components = {};
        // 8. 將實體的 isDestroyed 標記設為 true
        this.isDestroyed = true;
    }

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

    clone(): Entity {
        return this.world.cloneEntity(this);
    }

    fireEvent(name: string, data?: any): EntityEvent {
        const evt = new EntityEvent(name, data);
        evt.entity = this; // Assign the current entity to the event

        for (const key in this.components) {
            const v = this.components[key];

            if (v instanceof Component) {
                (v as any)._onEvent(evt);
                if (evt.prevented) return evt;
            } else if (Array.isArray(v)) {
                for (let i = 0; i < v.length; i++) {
                    (v[i] as any)._onEvent(evt);
                    if (evt.prevented) return evt;
                }
            } else { // Object for keyed components
                for (const component of Object.values(v)) {
                    component._onEvent(evt);
                    if (evt.prevented) return evt;
                }
            }
        }
        return evt;
    }
}
