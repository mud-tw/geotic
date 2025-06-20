import { Component } from './Component';
import { EntityEvent } from './EntityEvent';
import { addBit, hasBit, subtractBit } from './util/bit-util';
// Helper functions with types
const attachComponent = (entity, component) => {
    const key = component._ckey;
    entity[key] = component;
    entity.components[key] = component;
};
const attachComponentKeyed = (entity, component) => {
    const key = component._ckey;
    if (!component.keyProperty)
        return; // Should not happen if called correctly
    if (!entity.components[key]) {
        entity[key] = {};
        entity.components[key] = {};
    }
    const componentMap = entity.components[key];
    componentMap[component[component.keyProperty]] = component;
    entity[key][component[component.keyProperty]] = component;
};
const attachComponentArray = (entity, component) => {
    const key = component._ckey;
    if (!entity.components[key]) {
        entity[key] = [];
        entity.components[key] = [];
    }
    const componentArray = entity.components[key];
    componentArray.push(component);
    entity[key].push(component);
};
const removeComponent = (entity, component) => {
    const key = component._ckey;
    delete entity[key];
    delete entity.components[key];
    entity._cbits = subtractBit(entity._cbits, component._cbit);
    entity._candidacy();
};
const removeComponentKeyed = (entity, component) => {
    if (!component.keyProperty)
        return;
    const key = component._ckey;
    const keyPropValue = component[component.keyProperty];
    const entityKeyedComponents = entity[key];
    const componentsMap = entity.components[key];
    if (entityKeyedComponents)
        delete entityKeyedComponents[keyPropValue];
    if (componentsMap)
        delete componentsMap[keyPropValue];
    if (componentsMap && Object.keys(componentsMap).length <= 0) {
        delete entity[key];
        delete entity.components[key];
        entity._cbits = subtractBit(entity._cbits, component._cbit);
        entity._candidacy();
    }
};
const removeComponentArray = (entity, component) => {
    const key = component._ckey;
    const entityComponentArray = entity[key];
    const componentsArray = entity.components[key];
    if (entityComponentArray) {
        const idx = entityComponentArray.indexOf(component);
        if (idx !== -1)
            entityComponentArray.splice(idx, 1);
    }
    if (componentsArray) {
        const idx = componentsArray.indexOf(component);
        if (idx !== -1)
            componentsArray.splice(idx, 1);
    }
    if (componentsArray && componentsArray.length <= 0) {
        delete entity[key];
        delete entity.components[key];
        entity._cbits = subtractBit(entity._cbits, component._cbit);
        entity._candidacy();
    }
};
const serializeComponent = (component) => {
    return component.serialize();
};
const serializeComponentArray = (arr) => {
    return arr.map(serializeComponent);
};
const serializeComponentKeyed = (ob) => {
    const ser = {};
    for (const k in ob) {
        ser[k] = serializeComponent(ob[k]);
    }
    return ser;
};
export class Entity {
    constructor(world, id) {
        this._cbits = 0n;
        this._qeligible = true;
        this.world = world;
        this.id = id;
        this.components = {};
        this.isDestroyed = false;
    }
    _candidacy() {
        if (this._qeligible) {
            this.world._candidate(this);
        }
    }
    add(clazz, properties) {
        // TODO: Fix 'any' for properties, should be Partial<ConstructorParameters<typeof clazz>[0]> or similar
        const component = new clazz(properties);
        if (component.keyProperty) {
            attachComponentKeyed(this, component);
        }
        else if (component.allowMultiple) {
            attachComponentArray(this, component);
        }
        else {
            attachComponent(this, component);
        }
        this._cbits = addBit(this._cbits, component._cbit);
        component._onAttached(this);
        this._candidacy();
    }
    has(clazz) {
        // The `Function & { prototype: ... }` is a bit of a hack to handle un-migrated JS classes that will have .prototype
        // but might not be true ComponentClass<T> yet.
        return hasBit(this._cbits, clazz.prototype._cbit);
    }
    remove(component) {
        // Access static properties from the component's constructor
        const staticProps = component.constructor;
        if (staticProps.keyProperty) {
            // Cast component to any for removeComponentKeyed as it expects keyProperty directly for now
            removeComponentKeyed(this, component);
        }
        else if (staticProps.allowMultiple) {
            removeComponentArray(this, component);
        }
        else {
            removeComponent(this, component);
        }
        component._onDestroyed();
    }
    destroy() {
        for (const k in this.components) {
            const v = this.components[k];
            if (v instanceof Component) {
                this._cbits = subtractBit(this._cbits, v._cbit);
                v._onDestroyed();
            }
            else if (Array.isArray(v)) {
                for (const component of v) {
                    this._cbits = subtractBit(this._cbits, component._cbit);
                    component._onDestroyed();
                }
            }
            else { // Object for keyed components
                for (const component of Object.values(v)) {
                    this._cbits = subtractBit(this._cbits, component._cbit);
                    component._onDestroyed();
                }
            }
            delete this[k]; // Remove direct access property
            delete this.components[k];
        }
        this._candidacy();
        this.world._destroyed(this.id);
        this.components = {};
        this.isDestroyed = true;
    }
    serialize() {
        const serializedComponents = {};
        for (const k in this.components) {
            const v = this.components[k];
            if (v instanceof Component) {
                serializedComponents[k] = serializeComponent(v);
            }
            else if (Array.isArray(v)) {
                serializedComponents[k] = serializeComponentArray(v);
            }
            else { // Object for keyed components
                serializedComponents[k] = serializeComponentKeyed(v);
            }
        }
        return {
            id: this.id,
            ...serializedComponents,
        };
    }
    clone() {
        return this.world.cloneEntity(this);
    }
    fireEvent(name, data) {
        const evt = new EntityEvent(name, data);
        evt.entity = this; // Assign the current entity to the event
        for (const key in this.components) {
            const v = this.components[key];
            if (v instanceof Component) {
                v._onEvent(evt);
                if (evt.prevented)
                    return evt;
            }
            else if (Array.isArray(v)) {
                for (let i = 0; i < v.length; i++) {
                    v[i]._onEvent(evt);
                    if (evt.prevented)
                        return evt;
                }
            }
            else { // Object for keyed components
                for (const component of Object.values(v)) {
                    component._onEvent(evt);
                    if (evt.prevented)
                        return evt;
                }
            }
        }
        return evt;
    }
}
//# sourceMappingURL=Entity.js.map