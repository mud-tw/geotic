import { addBit, bitIntersection } from './util/bit-util';
import type { World } from './World';
import type { Entity } from './Entity';
import type { Component } from './Component';

// Type for a component class constructor, specifically needing the prototype._cbit
export type ComponentClassWithCBit = (new (...args: any[]) => Component) & { // Added export
    prototype: { _cbit: bigint };
};

export interface QueryFilters {
    any?: ComponentClassWithCBit[];
    all?: ComponentClassWithCBit[];
    none?: ComponentClassWithCBit[];
    immutableResult?: boolean;
}

type EntityListener = (entity: Entity) => void;

export class Query {
    private _world: World;
    private _cache: Entity[] = [];
    private _onAddListeners: EntityListener[] = [];
    private _onRemoveListeners: EntityListener[] = [];
    private _immutableResult: boolean;

    private readonly _any: bigint;
    private readonly _all: bigint;
    private readonly _none: bigint;

    constructor(world: World, filters: QueryFilters) {
        this._world = world;

        const anyComps = filters.any || [];
        const allComps = filters.all || [];
        const noneComps = filters.none || [];

        this._any = anyComps.reduce((s, c) => addBit(s, c.prototype._cbit), 0n);
        this._all = allComps.reduce((s, c) => addBit(s, c.prototype._cbit), 0n);
        this._none = noneComps.reduce((s, c) => addBit(s, c.prototype._cbit), 0n);

        this._immutableResult = filters.immutableResult === undefined ? true : filters.immutableResult;

        this.refresh();
    }

    onEntityAdded(fn: EntityListener): void {
        this._onAddListeners.push(fn);
    }

    onEntityRemoved(fn: EntityListener): void {
        this._onRemoveListeners.push(fn);
    }

    has(entity: Entity): boolean {
        return this.idx(entity) >= 0;
    }

    idx(entity: Entity): number {
        return this._cache.indexOf(entity);
    }

    matches(entity: Entity): boolean {
        const bits = entity._cbits; // Assuming _cbits is public or accessible

        const anyMatch = this._any === 0n || bitIntersection(bits, this._any) > 0n;
        const allMatch = bitIntersection(bits, this._all) === this._all;
        const noneMatch = this._none === 0n || bitIntersection(bits, this._none) === 0n;
        // Correction: for 'none', intersection should be 0. If _none is 0, it means no 'none' filter, so it always passes.
        // The original logic `bitIntersection(bits, this._none) === 0n` is correct.

        return anyMatch && allMatch && noneMatch;
    }

    candidate(entity: Entity): boolean {
        const idx = this.idx(entity);
        const isTracking = idx >= 0;

        // Check if entity is not destroyed and matches the query criteria
        if (!entity.isDestroyed && this.matches(entity)) {
            if (!isTracking) {
                // Add to cache and notify listeners if not already tracking
                this._cache.push(entity);
                this._onAddListeners.forEach((cb) => cb(entity));
            }
            return true; // Entity is a candidate and is now being tracked
        }

        // If entity is being tracked but no longer matches (or is destroyed)
        if (isTracking) {
            this._cache.splice(idx, 1);
            this._onRemoveListeners.forEach((cb) => cb(entity));
        }

        return false; // Entity is not a candidate or was removed
    }

    refresh(): void {
        this._cache = [];
        // Assuming _world._entities is a Map<string, Entity> or similar iterable
        this._world._entities.forEach((entity: Entity) => {
            this.candidate(entity);
        });
    }

    get(): Entity[] {
        return this._immutableResult ? [...this._cache] : this._cache;
    }
}
