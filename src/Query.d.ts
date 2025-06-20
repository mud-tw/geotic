import type { World } from './World';
import type { Entity } from './Entity';
import type { Component } from './Component';
export type ComponentClassWithCBit = (new (...args: any[]) => Component) & {
    prototype: {
        _cbit: bigint;
    };
};
export interface QueryFilters {
    any?: ComponentClassWithCBit[];
    all?: ComponentClassWithCBit[];
    none?: ComponentClassWithCBit[];
    immutableResult?: boolean;
}
type EntityListener = (entity: Entity) => void;
export declare class Query {
    private _world;
    private _cache;
    private _onAddListeners;
    private _onRemoveListeners;
    private _immutableResult;
    private readonly _any;
    private readonly _all;
    private readonly _none;
    constructor(world: World, filters: QueryFilters);
    onEntityAdded(fn: EntityListener): void;
    onEntityRemoved(fn: EntityListener): void;
    has(entity: Entity): boolean;
    idx(entity: Entity): number;
    matches(entity: Entity): boolean;
    candidate(entity: Entity): boolean;
    refresh(): void;
    get(): Entity[];
}
export {};
