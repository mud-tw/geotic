import { camelString } from './util/string-util';
import type { Component } from './Component';

// Define a type for the component class (constructor)
export type ComponentClass = new (...args: any[]) => Component; // Added export

interface ComponentMap {
    [key: string]: ComponentClass;
}

export class ComponentRegistry {
    private _cbit: number = 0;
    private _map: ComponentMap = {};

    register(clazz: ComponentClass): void {
        const key = camelString(clazz.name);

        // These properties are dynamically added to the prototype
        (clazz.prototype as any)._ckey = key;
        (clazz.prototype as any)._cbit = BigInt(++this._cbit);

        this._map[key] = clazz;
    }

    get(key: string): ComponentClass | undefined {
        return this._map[key];
    }
}
