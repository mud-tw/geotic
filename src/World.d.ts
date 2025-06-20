import { Entity, SerializedEntity } from './Entity';
import { Query, QueryFilters } from './Query';
import type { Engine } from './Engine';
import type { ComponentProperties } from './Component';
export interface SerializedWorldData {
    entities: SerializedEntity[];
}
export declare class World {
    engine: Engine;
    private _id_counter;
    private _queries;
    _entities: Map<string, Entity>;
    constructor(engine: Engine);
    createId(): string;
    getEntity(id: string): Entity | undefined;
    getEntities(): IterableIterator<Entity>;
    createEntity(id?: string): Entity;
    destroyEntity(id: string): void;
    destroyEntities(): void;
    destroy(): void;
    createQuery(filters: QueryFilters): Query;
    createPrefab(name: string, properties?: Partial<ComponentProperties>): Entity | undefined;
    serialize(entities?: Iterable<Entity> | Map<string, Entity>): SerializedWorldData;
    cloneEntity(entity: Entity): Entity;
    deserialize(data: SerializedWorldData): void;
    private _createOrGetEntityById;
    private _deserializeEntity;
    _candidate(entity: Entity): void;
    _destroyed(id: string): boolean;
}
