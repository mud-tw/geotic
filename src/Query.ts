import { addBit, bitIntersection } from './util/bit-util';
import type { World } from './World';
import type { Entity } from './Entity';
import type { Component } from './Component';

/**
 * Type alias for a Component class constructor that is guaranteed to have `_cbit`
 * on its prototype. This is used in QueryFilters.
 */
export type ComponentClassWithCBit = (new (...args: any[]) => Component) & {
    prototype: { _cbit: bigint };
};

/**
 * Defines the structure for query filters, specifying which components entities
 * must have (`all`), may have (`any`), or must not have (`none`).
 * Also includes an option for result immutability.
 */
export interface QueryFilters {
    /** Entities must have at least one of these component types. */
    any?: ComponentClassWithCBit[];
    /** Entities must have all of these component types. */
    all?: ComponentClassWithCBit[];
    /** Entities must not have any of these component types. */
    none?: ComponentClassWithCBit[];
    /**
     * If true (default), `query.get()` returns a copy of the results.
     * If false, it returns a direct reference to the internal cache (faster, but risky if modified).
     */
    immutableResult?: boolean;
}

/**
 * Type for callback functions that listen to entity additions or removals from a query.
 */
type EntityListener = (entity: Entity) => void;

/**
 * A Query dynamically maintains a collection of entities that match a specific set of component criteria.
 * Systems use queries to efficiently iterate over relevant entities.
 *
 * Relationships:
 * - Created by and belongs to a `World`.
 * - Operates on `Entity` instances within that `World`.
 * - Uses component bitmasks (`_cbit` from `ComponentClassWithCBit`) for matching.
 *
 * How it works:
 * - When created, it calculates combined bitmasks (`_any`, `_all`, `_none`) from the filter criteria.
 * - The `World` notifies the query (via `candidate()`) when an entity's component composition changes.
 * - `candidate()` checks if the entity matches the query's criteria using bitwise operations
 *   on the entity's `_cbits` and the query's pre-calculated filter bitmasks.
 * - If an entity starts or stops matching, it's added to or removed from an internal `_cache`,
 *   and respective listeners (`_onAddListeners`, `_onRemoveListeners`) are triggered.
 * - `get()` provides access to the current list of matching entities.
 */
export class Query {
    /** @private The world this query belongs to and operates within. */
    private _world: World;
    /** @private Internal cache of entities currently matching the query criteria. */
    private _cache: Entity[] = [];
    /** @private Listeners to be called when an entity is added to this query. */
    private _onAddListeners: EntityListener[] = [];
    /** @private Listeners to be called when an entity is removed from this query. */
    private _onRemoveListeners: EntityListener[] = [];
    /** @private Determines if `get()` returns a mutable or immutable array of results. */
    private _immutableResult: boolean;

    /** @private Combined bitmask for the 'any' filter. An entity matches if it has at least one of these bits. */
    private readonly _any: bigint;
    /** @private Combined bitmask for the 'all' filter. An entity matches if it has all of these bits. */
    private readonly _all: bigint;
    /** @private Combined bitmask for the 'none' filter. An entity matches if it has none of these bits. */
    private readonly _none: bigint;

    /**
     * Creates a new Query instance.
     * Typically called by `world.createQuery()`.
     * @param world The world this query will operate in.
     * @param filters The component filter criteria for this query.
     */
    constructor(world: World, filters: QueryFilters) {
        this._world = world;

        // Initialize filter component arrays, defaulting to empty if not provided.
        const anyComps = filters.any || [];
        const allComps = filters.all || [];
        const noneComps = filters.none || [];

        // Calculate the combined bitmasks for each filter type.
        // Each component class in the filters must have `_cbit` on its prototype.
        this._any = anyComps.reduce((s, c) => addBit(s, c.prototype._cbit), 0n);
        this._all = allComps.reduce((s, c) => addBit(s, c.prototype._cbit), 0n);
        this._none = noneComps.reduce((s, c) => addBit(s, c.prototype._cbit), 0n);

        // Set result immutability, defaulting to true (safer).
        this._immutableResult = filters.immutableResult === undefined ? true : filters.immutableResult;

        // Perform an initial population of the cache.
        this.refresh();
    }

    /**
     * Registers a callback function to be invoked when an entity is added to this query
     * (i.e., it starts matching the query's criteria).
     * @param fn The callback function, which receives the added entity as an argument.
     */
    onEntityAdded(fn: EntityListener): void {
        this._onAddListeners.push(fn);
    }

    /**
     * Registers a callback function to be invoked when an entity is removed from this query
     * (i.e., it stops matching the query's criteria or is destroyed).
     * @param fn The callback function, which receives the removed entity as an argument.
     */
    onEntityRemoved(fn: EntityListener): void {
        this._onRemoveListeners.push(fn);
    }

    /**
     * Checks if a given entity is currently part of this query's result set (i.e., is in the cache).
     * @param entity The entity to check.
     * @returns `true` if the entity is in the query, `false` otherwise.
     */
    has(entity: Entity): boolean {
        return this.idx(entity) >= 0;
    }

    /**
     * @private Gets the index of an entity within the internal cache.
     * @param entity The entity to find.
     * @returns The index of the entity if found, or -1 if not.
     */
    private idx(entity: Entity): number {
        return this._cache.indexOf(entity);
    }

    /**
     * Checks if an entity's component composition matches the query's filter criteria.
     * This is done using bitwise operations on the entity's component bitmask (`_cbits`)
     * and the query's pre-calculated `_any`, `_all`, and `_none` bitmasks.
     * @param entity The entity to check.
     * @returns `true` if the entity matches all criteria, `false` otherwise.
     */
    matches(entity: Entity): boolean {
        const bits = entity._cbits; // Entity's combined component bitmask

        // 'any' filter: True if no 'any' components are specified (this._any is 0n),
        // OR if the entity's bits have at least one bit in common with this._any.
        const anyMatch = this._any === 0n || bitIntersection(bits, this._any) > 0n;

        // 'all' filter: True if the entity's bits include ALL bits specified in this._all.
        const allMatch = bitIntersection(bits, this._all) === this._all;

        // 'none' filter: True if no 'none' components are specified (this._none is 0n),
        // OR if the entity's bits have NO bits in common with this._none.
        const noneMatch = this._none === 0n || bitIntersection(bits, this._none) === 0n;

        return anyMatch && allMatch && noneMatch;
    }

    /**
     * Evaluates if an entity is a candidate for this query and updates the cache accordingly.
     * This method is called by the World when an entity's components change, or during `refresh()`.
     *
     * @param entity The entity to evaluate.
     * @returns `true` if the entity currently matches the query criteria and is being tracked (or was just added),
     *          `false` if it does not match (or was just removed).
     */
    candidate(entity: Entity): boolean {
        const isCurrentlyTracked = this.has(entity); // Is the entity already in our cache?

        // Check if the entity meets the query criteria:
        // 1. It must not be destroyed.
        // 2. Its component composition must match the query's filters.
        if (!entity.isDestroyed && this.matches(entity)) {
            // Entity matches the criteria.
            if (!isCurrentlyTracked) {
                // It's a new match, add it to the cache.
                this._cache.push(entity);
                // Notify all 'onEntityAdded' listeners.
                this._onAddListeners.forEach((cb) => cb(entity));
            }
            return true; // Entity is a match (either new or existing).
        }

        // Entity does not match the criteria (or is destroyed).
        if (isCurrentlyTracked) {
            // It was previously a match, so remove it from the cache.
            this._cache.splice(this.idx(entity), 1);
            // Notify all 'onEntityRemoved' listeners.
            this._onRemoveListeners.forEach((cb) => cb(entity));
        }

        return false; // Entity is not a match.
    }

    /**
     * Forces a full refresh of the query's cache.
     * It clears the current cache and re-evaluates every entity in the world
     * against the query's criteria. This can be an expensive operation and is
     * typically used for initialization or if manual refresh is explicitly needed.
     */
    refresh(): void {
        this._cache = [];
        // Iterate over all entities in the world and check if they are candidates.
        for (const entity of this._world.getEntities()) {
            this.candidate(entity);
        }
    }

    /**
     * Gets the array of entities currently matching this query.
     * Depending on the `immutableResult` option set during query creation:
     * - If `true` (default): Returns a shallow copy of the internal cache. This is safer as
     *   external modifications to the returned array won't affect the query's internal state.
     * - If `false`: Returns a direct reference to the internal cache array. This is more performant
     *   as it avoids an array copy, but modifications to the returned array will directly alter
     *   the query's cache, which can lead to undefined behavior. Use with caution.
     *
     * @returns An array of `Entity` instances.
     */
    get(): Entity[] {
        return this._immutableResult ? [...this._cache] : this._cache;
    }
}
