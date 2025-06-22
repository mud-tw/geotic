import { Entity, SerializedEntity } from './Entity';
import { Query, QueryFilters } from './Query';
import { camelString, uuid } from './util/string-util';
import type { Engine } from './Engine';
import type { ComponentProperties } from './Component';
import type { ComponentClass } from './ComponentRegistry'; // Assuming ComponentRegistry exports this

export interface SerializedWorldData {
    entities: SerializedEntity[];
}

export class World {
    engine: Engine;
    private _id_counter: number = 0;
    private _queries: Query[] = [];
    private _entities: Map<string, Entity> = new Map(); // Now private

    constructor(engine: Engine) {
        this.engine = engine;
    }

    createId(): string {
        // Consider using a more robust UUID generator if these IDs need to be globally unique
        // return `${++this._id_counter}-${Math.random().toString(36).substring(2, 11)}`;
        return uuid(); // Using uuid for better uniqueness
    }

    getEntity(id: string): Entity | undefined {
        return this._entities.get(id);
    }

    getEntities(): IterableIterator<Entity> {
        return this._entities.values();
    }

    createEntity(id: string = this.createId()): Entity {
        if (this._entities.has(id)) {
            // Or throw an error, depending on desired behavior
            console.warn(`Entity with id "${id}" already exists. Returning existing entity.`);
            return this._entities.get(id)!;
        }
        const entity = new Entity(this, id);
        this._entities.set(id, entity);
        return entity;
    }

    destroyEntity(id: string): void {
        const entity = this.getEntity(id);
        if (entity) {
            entity.destroy(); // This should trigger _destroyed and _candidate
        }
    }

    destroyEntities(): void {
        // Create a copy of entities to iterate over, as entity.destroy() modifies the collection
        const allEntities = Array.from(this._entities.values());
        allEntities.forEach((entity) => {
            entity.destroy();
        });
    }

    destroy(): void {
        this.destroyEntities();
        this._id_counter = 0;
        this._queries = [];
        this._entities.clear(); // More explicit than new Map()
    }

    createQuery(filters: QueryFilters): Query {
        const query = new Query(this, filters);
        this._queries.push(query);
        return query;
    }

    createPrefab(name: string, properties: Partial<ComponentProperties> = {}): Entity | undefined {
        return this.engine.createPrefabInstance(this, name, properties);
    }

    serialize(entities?: Iterable<Entity> | Map<string, Entity>): SerializedWorldData {
        const json: SerializedEntity[] = [];
        let entityList: Iterable<Entity>;

        if (entities) {
            if (entities instanceof Map) {
                entityList = entities.values();
            } else {
                entityList = entities; // entities is already Iterable<Entity>
            }
        } else {
            entityList = this._entities.values();
        }

        for (const e of entityList) { // Changed to for...of loop for iterables
            json.push(e.serialize());
        } // Removed extra );

        return {
            entities: json,
        };
    }

    cloneEntity(entity: Entity): Entity {
        const data = entity.serialize();
        data.id = this.createId(); // Ensure the cloned entity gets a new unique ID
        return this._deserializeEntity(data);
    }

    deserialize(data: SerializedWorldData): void {
        // First pass: create all entities to handle potential relationships in components
        // (though this simple deserialization doesn't handle inter-entity component references)
        for (const entityData of data.entities) {
            this._createOrGetEntityById(entityData.id);
        }

        // Second pass: deserialize components
        for (const entityData of data.entities) {
            this._deserializeEntity(entityData);
        }
    }

    private _createOrGetEntityById(id: string): Entity {
        return this.getEntity(id) || this.createEntity(id);
    }

    private _deserializeEntity(data: SerializedEntity): Entity {
        const { id, ...componentsData } = data;
        const entity = this._createOrGetEntityById(id);
        entity._qeligible = false; // Disable query candidacy during component population

        Object.entries(componentsData).forEach(([componentKey, componentValue]) => {
            const componentTypeString = camelString(componentKey);
            const componentClass = this.engine.getComponentClass(componentTypeString) as (ComponentClass & {allowMultiple?: boolean}) | undefined;

            if (!componentClass) {
                console.warn(`Component class for type "${componentTypeString}" (key: "${componentKey}") not found in engine's component registry.`);
                return;
            }

            if (componentClass.allowMultiple) {
                // Expect componentValue to be an array or object of component instances data
                if (Array.isArray(componentValue)) { // Array of component properties
                    componentValue.forEach((singleComponentProps: any) => {
                        entity.add(componentClass, singleComponentProps);
                    });
                } else if (typeof componentValue === 'object' && componentValue !== null) { // Map of keyed component properties
                    Object.values(componentValue).forEach((singleComponentProps: any) => {
                        entity.add(componentClass, singleComponentProps);
                    });
                } else {
                     console.warn(`Expected array or object for multi-component "${componentKey}", got:`, componentValue);
                }
            } else {
                // Single component, componentValue is its properties
                entity.add(componentClass, componentValue);
            }
        });

        entity._qeligible = true;
        entity._candidacy();
        return entity;
    }

    // Called by Entity when its component makeup changes
    public entityCompositionChanged(entity: Entity): void { // Renamed from _candidate and made public
        this._queries.forEach((q) => q.candidate(entity));
    }

    // Called by Entity when it's destroyed
    public entityWasDestroyed(id: string): boolean { // Renamed from _destroyed and made public
        return this._entities.delete(id);
    }
}
