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

    /**
     * 判斷一個實體是否為此查詢的候選者，並更新快取與觸發事件。
     * 
     * @param entity 要檢查的實體
     * @returns 如果實體是候選者（即符合查詢條件且正在被追蹤），則返回 true；否則返回 false。
     */
    candidate(entity: Entity): boolean {
        // 1. 檢查實體是否已存在於快取中
        const idx = this.idx(entity); // this.idx(entity) 會返回實體在 _cache 陣列中的索引，若不存在則為 -1
        const isTracking = idx >= 0;  // 如果 idx >= 0，表示此實體已在快取中，正在被追蹤
    
        // 2. 檢查實體是否符合查詢條件：
        //    - 實體未被銷毀 (entity.isDestroyed === false)
        //    - 實體的組件構成符合查詢的篩選條件 (this.matches(entity) === true)
        if (!entity.isDestroyed && this.matches(entity)) {
            // 2.1 如果實體符合條件，且尚未被追蹤
            if (!isTracking) {
                // 將實體加入快取
                this._cache.push(entity);
                // 觸發所有 "onEntityAdded" (實體加入查詢) 的監聽器
                this._onAddListeners.forEach((cb) => cb(entity));
            }
            // 實體現在是候選者且已被追蹤
            return true;
        }
    
        // 3. 如果實體不符合查詢條件 (例如被銷毀，或組件不再匹配)，
        //    但先前正在被追蹤
        if (isTracking) {
            // 從快取中移除此實體
            this._cache.splice(idx, 1);
            // 觸發所有 "onEntityRemoved" (實體從查詢中移除) 的監聽器
            this._onRemoveListeners.forEach((cb) => cb(entity));
        }
    
        // 4. 如果執行到這裡，表示實體不符合查詢條件，或者已被從快取中移除
        return false;
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

    get entities(): Entity[] {
        return this.get();
    }
}
