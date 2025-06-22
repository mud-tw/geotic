import { Entity, SerializedEntity } from './Entity';
import { Query, QueryFilters } from './Query';
import { camelString, uuid } from './util/string-util';
import type { Engine } from './Engine';
import type { ComponentProperties } from './Component';
import type { ComponentClass } from './ComponentRegistry';

/**
 * Defines the structure for serialized world data, primarily containing a list of serialized entities.
 */
export interface SerializedWorldData {
    entities: SerializedEntity[];
}

/**
 * A World is a container for entities, components, and queries.
 * It represents a distinct simulation space. An application can have multiple worlds.
 *
 * Relationships:
 * - Belongs to an `Engine`, which provides access to component and prefab registries.
 * - Manages a collection of `Entity` instances.
 * - Manages a collection of `Query` instances, which are used to efficiently retrieve entities
 *   based on their components.
 *
 * Responsibilities:
 * - Creating and destroying entities.
 * - Creating and managing queries.
 * - Serializing and deserializing the state of all its entities and components.
 * - Cloning entities.
 * - Tracking changes to entity compositions to update queries.
 */
export class World {
    /** The engine instance this world belongs to. Used to access shared resources like component definitions. */
    engine: Engine;
    /** @private Counter for generating simple sequential IDs, primarily as a fallback or for non-UUID needs. */
    private _id_counter: number = 0;
    /** @private List of all queries registered in this world. */
    private _queries: Query[] = [];
    /** @private Map storing all entities in this world, keyed by their unique ID. */
    private _entities: Map<string, Entity> = new Map();

    /**
     * Creates a new World instance.
     * @param engine The engine this world will be associated with.
     */
    constructor(engine: Engine) {
        this.engine = engine;
    }

    /**
     * Generates a unique ID for an entity.
     * Uses a UUID generator for robust uniqueness.
     * @returns A unique string ID.
     */
    createId(): string {
        return uuid();
    }

    /**
     * Retrieves an entity by its ID.
     * @param id The unique ID of the entity.
     * @returns The Entity instance if found, otherwise undefined.
     */
    getEntity(id: string): Entity | undefined {
        return this._entities.get(id);
    }

    /**
     * Gets an iterator for all entities currently active in this world.
     * @returns An IterableIterator yielding all Entity instances.
     */
    getEntities(): IterableIterator<Entity> {
        return this._entities.values();
    }

    /**
     * Creates a new entity in this world.
     * If an ID is provided and already exists, a warning is issued and the existing entity is returned.
     * @param id Optional. A specific ID to assign to the new entity. If not provided, a new unique ID is generated.
     * @returns The newly created (or existing, if ID conflicted) Entity instance.
     */
    createEntity(id: string = this.createId()): Entity {
        if (this._entities.has(id)) {
            console.warn(`Entity with id "${id}" already exists. Returning existing entity.`);
            return this._entities.get(id)!;
        }
        const entity = new Entity(this, id);
        this._entities.set(id, entity);
        return entity;
    }

    /**
     * Destroys an entity by its ID.
     * This involves calling the entity's own `destroy` method, which handles component cleanup
     * and notification to the world and queries.
     * @param id The ID of the entity to destroy.
     */
    destroyEntity(id: string): void {
        const entity = this.getEntity(id);
        if (entity) {
            entity.destroy();
        }
    }

    /**
     * Destroys all entities currently active in this world.
     * Iterates over a copy of the entity list to avoid modification issues during destruction.
     */
    destroyEntities(): void {
        const allEntities = Array.from(this._entities.values());
        allEntities.forEach((entity) => {
            entity.destroy();
        });
    }

    /**
     * Destroys the world and all its contents.
     * This includes all entities and queries. Resets internal state.
     */
    destroy(): void {
        this.destroyEntities();
        this._id_counter = 0;
        this._queries = [];
        this._entities.clear();
    }

    /**
     * Creates a new query in this world based on the provided component filters.
     * The query will dynamically track entities that match the criteria.
     * @param filters An object defining which components entities must have (`all`),
     *                may have (`any`), or must not have (`none`).
     * @returns The newly created Query instance.
     */
    createQuery(filters: QueryFilters): Query {
        const query = new Query(this, filters);
        this._queries.push(query);
        return query;
    }

    /**
     * Creates an entity from a registered prefab.
     * Delegates the actual instantiation to the engine's `PrefabRegistry`.
     * @param name The name of the prefab to instantiate.
     * @param properties Optional. An object with properties to override the prefab's defaults.
     * @returns The created Entity instance if the prefab exists, otherwise undefined.
     */
    createPrefab(name: string, properties: Partial<ComponentProperties> = {}): Entity | undefined {
        return this.engine.createPrefabInstance(this, name, properties);
    }

    /**
     * Serializes the state of entities in this world into a JSON-compatible object.
     * By default, serializes all entities. Can optionally serialize a specific subset.
     * @param entities Optional. An iterable or Map of entities to serialize. If not provided, all entities in the world are serialized.
     * @returns A `SerializedWorldData` object containing the serialized entity data.
     */
    serialize(entities?: Iterable<Entity> | Map<string, Entity>): SerializedWorldData {
        const json: SerializedEntity[] = [];
        let entityList: Iterable<Entity>;

        if (entities) {
            if (entities instanceof Map) {
                entityList = entities.values();
            } else {
                entityList = entities;
            }
        } else {
            entityList = this._entities.values();
        }

        for (const e of entityList) {
            json.push(e.serialize());
        }

        return {
            entities: json,
        };
    }

    /**
     * Clones an existing entity, creating a new entity with a new ID but identical components and properties.
     * @param entity The entity to clone.
     * @returns The newly created (cloned) Entity instance.
     */
    cloneEntity(entity: Entity): Entity {
        const data = entity.serialize();
        data.id = this.createId(); // Ensure the cloned entity gets a new unique ID
        return this._deserializeEntity(data);
    }

    /**
     * Deserializes world data, recreating entities and their components.
     * This is a two-pass process:
     * 1. Create all entity instances (or retrieve existing ones by ID).
     * 2. Populate entities with their components based on the serialized data.
     * This approach helps manage potential inter-entity references if they were supported more deeply.
     * @param data The `SerializedWorldData` to deserialize.
     */
    deserialize(data: SerializedWorldData): void {
        for (const entityData of data.entities) {
            this._createOrGetEntityById(entityData.id);
        }

        for (const entityData of data.entities) {
            this._deserializeEntity(entityData);
        }
    }

    /**
     * @private Helper method to either get an existing entity by ID or create a new one if it doesn't exist.
     * Used during deserialization.
     * @param id The ID of the entity to get or create.
     * @returns The existing or newly created Entity.
     */
    private _createOrGetEntityById(id: string): Entity {
        return this.getEntity(id) || this.createEntity(id);
    }

    /**
     * @private Deserializes a single entity's data, adding components to it.
     * @param data The `SerializedEntity` data for a single entity.
     * @returns The Entity instance after components have been added.
     */
    private _deserializeEntity(data: SerializedEntity): Entity {
        const { id, ...componentsData } = data;
        const entity = this._createOrGetEntityById(id);
        entity._qeligible = false; // Temporarily disable query eligibility for performance

        Object.entries(componentsData).forEach(([componentKey, componentValue]) => {
            const componentTypeString = camelString(componentKey); // Convert serialized key to component ckey
            const componentClass = this.engine.getComponentClass(componentTypeString) as (ComponentClass & {allowMultiple?: boolean}) | undefined;

            if (!componentClass) {
                console.warn(`Component class for type "${componentTypeString}" (key: "${componentKey}") not found in engine's component registry.`);
                return;
            }

            // Handle components that allow multiple instances (arrays or keyed objects)
            if (componentClass.allowMultiple) {
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
                // Single component instance
                entity.add(componentClass, componentValue);
            }
        });

        entity._qeligible = true; // Re-enable query eligibility
        entity._candidacy(); // Notify queries that this entity's composition might have changed
        return entity;
    }

    /**
     * Called by an Entity when its component composition changes (component added/removed).
     * This method iterates through all registered queries and notifies them to re-evaluate
     * whether the changed entity matches their criteria.
     * @param entity The entity whose composition has changed.
     * @public
     */
    public entityCompositionChanged(entity: Entity): void {
        this._queries.forEach((q) => q.candidate(entity));
    }

    /**
     * Called by an Entity when it is destroyed.
     * This method removes the entity from the world's internal list of active entities.
     * @param id The ID of the entity that was destroyed.
     * @returns `true` if the entity was successfully found and removed, `false` otherwise.
     * @public
     */
    public entityWasDestroyed(id: string): boolean {
        return this._entities.delete(id);
    }
}
