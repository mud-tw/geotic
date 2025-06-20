import { Entity } from './Entity';
import { Query } from './Query';
import { camelString } from './util/string-util';
export class World {
    constructor(engine) {
        this._id_counter = 0; // Renamed from _id to avoid confusion with entity id
        this._queries = [];
        this._entities = new Map(); // Made package-private for Query.refresh for now
        this.engine = engine;
    }
    createId() {
        // Consider using a more robust UUID generator if these IDs need to be globally unique
        return `${++this._id_counter}-${Math.random().toString(36).substring(2, 11)}`;
    }
    getEntity(id) {
        return this._entities.get(id);
    }
    getEntities() {
        return this._entities.values();
    }
    createEntity(id = this.createId()) {
        if (this._entities.has(id)) {
            // Or throw an error, depending on desired behavior
            console.warn(`Entity with id "${id}" already exists. Returning existing entity.`);
            return this._entities.get(id);
        }
        const entity = new Entity(this, id);
        this._entities.set(id, entity);
        return entity;
    }
    destroyEntity(id) {
        const entity = this.getEntity(id);
        if (entity) {
            entity.destroy(); // This should trigger _destroyed and _candidate
        }
    }
    destroyEntities() {
        // Create a copy of entities to iterate over, as entity.destroy() modifies the collection
        const allEntities = Array.from(this._entities.values());
        allEntities.forEach((entity) => {
            entity.destroy();
        });
    }
    destroy() {
        this.destroyEntities();
        this._id_counter = 0;
        this._queries = [];
        this._entities.clear(); // More explicit than new Map()
    }
    createQuery(filters) {
        const query = new Query(this, filters);
        this._queries.push(query);
        return query;
    }
    createPrefab(name, properties = {}) {
        // engine._prefabs is private, so we should use a public method on engine if available
        // For now, assuming direct access for conversion, but this should be refactored in Engine.ts
        return this.engine._prefabs.create(this, name, properties);
    }
    serialize(entities) {
        const json = [];
        let entityList;
        if (entities) {
            if (entities instanceof Map) {
                entityList = entities.values();
            }
            else {
                entityList = entities; // entities is already Iterable<Entity>
            }
        }
        else {
            entityList = this._entities.values();
        }
        for (const e of entityList) { // Changed to for...of loop for iterables
            json.push(e.serialize());
        } // Removed extra );
        return {
            entities: json,
        };
    }
    cloneEntity(entity) {
        const data = entity.serialize();
        data.id = this.createId(); // Ensure the cloned entity gets a new unique ID
        return this._deserializeEntity(data);
    }
    deserialize(data) {
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
    _createOrGetEntityById(id) {
        return this.getEntity(id) || this.createEntity(id);
    }
    _deserializeEntity(data) {
        const { id, ...componentsData } = data;
        const entity = this._createOrGetEntityById(id);
        entity._qeligible = false; // Disable query candidacy during component population
        Object.entries(componentsData).forEach(([componentKey, componentValue]) => {
            const componentTypeString = camelString(componentKey);
            // Accessing _components is a direct reach, should be through a getter in Engine
            const componentClass = this.engine._components.get(componentTypeString);
            if (!componentClass) {
                console.warn(`Component class for type "${componentTypeString}" (key: "${componentKey}") not found in engine's component registry.`);
                return;
            }
            if (componentClass.allowMultiple) {
                // Expect componentValue to be an array or object of component instances data
                if (Array.isArray(componentValue)) { // Array of component properties
                    componentValue.forEach((singleComponentProps) => {
                        entity.add(componentClass, singleComponentProps);
                    });
                }
                else if (typeof componentValue === 'object' && componentValue !== null) { // Map of keyed component properties
                    Object.values(componentValue).forEach((singleComponentProps) => {
                        entity.add(componentClass, singleComponentProps);
                    });
                }
                else {
                    console.warn(`Expected array or object for multi-component "${componentKey}", got:`, componentValue);
                }
            }
            else {
                // Single component, componentValue is its properties
                entity.add(componentClass, componentValue);
            }
        });
        entity._qeligible = true;
        entity._candidacy();
        return entity;
    }
    // Called by Entity when its component makeup changes
    _candidate(entity) {
        this._queries.forEach((q) => q.candidate(entity));
    }
    // Called by Entity when it's destroyed
    _destroyed(id) {
        return this._entities.delete(id);
    }
}
//# sourceMappingURL=World.js.map