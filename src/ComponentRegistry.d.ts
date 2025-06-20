import type { Component } from './Component';
export type ComponentClass = new (...args: any[]) => Component;
export declare class ComponentRegistry {
    private _cbit;
    private _map;
    register(clazz: ComponentClass): void;
    get(key: string): ComponentClass | undefined;
}
