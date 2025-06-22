import { Engine, World, Entity, Query, Component, ComponentClass, QueryFilters, ComponentClassWithCBit } from '../../src'; // Adjusted path

// Use global chance instance if available
declare const chance: Chance.Chance;

describe('World', () => {
    let world: World;
    let engine: Engine; // Added engine

    beforeEach(() => {
        engine = new Engine(); // Initialize engine
        world = engine.createWorld();
    });

    describe('createEntity', () => {
        let entity: Entity;

        describe('without an ID', () => {
            beforeEach(() => {
                entity = world.createEntity();
            });

            it('should be able to recall the entity by id', () => {
                const result = world.getEntity(entity.id);
                expect(result).toBe(entity);
            });

            it('should assign a string ID', () => {
                expect(typeof entity.id).toBe('string');
            });
        });

        describe('with an ID', () => {
            let givenId: string;

            beforeEach(() => {
                givenId = chance.guid();
                entity = world.createEntity(givenId);
            });

            it('should assign the ID to the entity', () => {
                expect(entity.id).toBe(givenId);
            });

            it('should be able to recall the entity by id', () => {
                const result = world.getEntity(givenId);
                expect(result).toBe(entity);
            });
        });
    });

    describe('destroyEntity', () => {
        let entity: Entity;

        beforeEach(() => {
            entity = world.createEntity();
            // Spy on entity.destroy to ensure it's called
            jest.spyOn(entity, 'destroy');
            world.destroyEntity(entity.id);
        });

        it('should no longer be able to recall by entity id from the world', () => {
            const result = world.getEntity(entity.id);
            expect(result).toBeUndefined();
        });

        it('should call destroy on the entity instance', () => {
            expect(entity.destroy).toHaveBeenCalledTimes(1);
        });
    });

    describe('destroy (World)', () => {
        let entity1: Entity, entity2: Entity;
        let spy1: jest.SpyInstance, spy2: jest.SpyInstance;

        beforeEach(() => {
            entity1 = world.createEntity();
            entity2 = world.createEntity();
            spy1 = jest.spyOn(entity1, 'destroy');
            spy2 = jest.spyOn(entity2, 'destroy');
            world.destroy();
        });

        it('should destroy all entities in the world', () => {
            expect(spy1).toHaveBeenCalledTimes(1);
            expect(spy2).toHaveBeenCalledTimes(1);
            expect(world.getEntity(entity1.id)).toBeUndefined();
            expect(world.getEntity(entity2.id)).toBeUndefined();
        });

        it('should reset queries (queries array should be empty)', () => {
            // This requires checking internal state or a method to inspect queries
            expect((world as any)._queries.length).toBe(0);
        });
    });

    describe('createQuery', () => {
        class CompA extends Component {}
        const CompA_Query = CompA as unknown as ComponentClassWithCBit;

        beforeEach(() => {
            engine.registerComponent(CompA as ComponentClass);
        });

        it('should create and return a Query instance', () => {
            const filters: QueryFilters = { all: [CompA_Query] };
            const query = world.createQuery(filters);
            expect(query).toBeInstanceOf(Query);
        });

        it('should add the query to the world\'s internal list of queries', () => {
            const filters: QueryFilters = { all: [CompA_Query] };
            world.createQuery(filters);
            // Accessing private _queries for test verification
            expect((world as any)._queries).toHaveLength(1);
            expect((world as any)._queries[0]).toBeInstanceOf(Query);
        });
    });

    // Add more tests for serialize, deserialize, cloneEntity, createPrefab if time permits
    // For now, focusing on core methods.

    // TODO: Test for createId - e.g., uniqueness, format if important.
    // TODO: Test for getEntities - e.g., returns all entities, empty iterator for new world.
    // TODO: Test for destroyEntities - e.g., on empty world, ensure _entities map is cleared.

    describe('createPrefab', () => {
        // TODO: Test world.createPrefab()
        //    - Basic prefab creation
        //    - Prefab creation with property overrides
        //    - Attempting to create a non-existent prefab
        class TestPrefabComp extends Component { static properties = { val: 0 }; val!: number; }
        beforeEach(() => {
            engine.registerComponent(TestPrefabComp as ComponentClass);
            engine.registerPrefab({ name: 'MyTestPrefab', components: [{type: 'TestPrefabComp', properties: {val: 10}}]});
        });

        it('should create an entity from a registered prefab', () => {
            const entity = world.createPrefab('MyTestPrefab');
            expect(entity).toBeInstanceOf(Entity);
            expect(entity?.has(TestPrefabComp)).toBe(true);
            expect(entity?.get(TestPrefabComp)?.val).toBe(10);
        });

        it('should override prefab properties when creating from prefab', () => {
            const entity = world.createPrefab('MyTestPrefab', { testPrefabComp: { val: 20 } });
            expect(entity?.get(TestPrefabComp)?.val).toBe(20);
        });

        it('should return undefined for a non-existent prefab', () => {
            const entity = world.createPrefab('NonExistentPrefab');
            expect(entity).toBeUndefined();
        });
    });

    describe('serialize', () => {
        // TODO: Test world.serialize()
        //    - Empty world
        //    - World with multiple entities and diverse components (single, multi-array, multi-keyed)
        //    - Serializing a specific subset of entities
        it.todo('should serialize world state');
    });

    describe('deserialize', () => {
        // TODO: Test world.deserialize()
        //    - Empty world / empty data
        //    - Deserializing into an empty world
        //    - Deserializing data that merges/overwrites
        //    - Deserializing complex entity structures
        //    - Robustness against malformed data (e.g., unknown component types - should warn)
        //    - Ensure _createOrGetEntityById and _deserializeEntity logic is covered
        it.todo('should deserialize world state');
    });

    describe('cloneEntity', () => {
        // TODO: Test world.cloneEntity()
        //    - Cloned entity has new ID
        //    - Components and properties are deeply cloned
        //    - Original entity unaffected
        //    - Cloning with various component types
        it.todo('should clone an entity');
    });


    describe('entityCompositionChanged (formerly _candidate)', () => {
        class TrackableComponent extends Component {}
        const TrackableQuery = TrackableComponent as unknown as ComponentClassWithCBit;
        let entity: Entity;
        let query: Query;

        beforeEach(() => {
            engine.registerComponent(TrackableComponent as ComponentClass);
            query = world.createQuery({ all: [TrackableQuery] });
            entity = world.createEntity();
        });

        it('should update query results when an entity gains a relevant component', () => {
            // Initially, entity should not be in the query
            expect(query.get()).not.toContain(entity);

            // Manually call entityCompositionChanged (as if entity._candidacy was called)
            // This direct call simulates the entity notifying the world *before* component is actually added by entity.add
            // In real scenario, entity.add() -> entity._candidacy() -> world.entityCompositionChanged()
            world.entityCompositionChanged(entity);
            expect(query.get()).not.toContain(entity); // Still should not contain

            entity.add(TrackableComponent); // This will call _candidacy -> world.entityCompositionChanged

            // Query should now contain the entity
            expect(query.get()).toContain(entity);
        });

        it('should update query results when an entity loses a relevant component', () => {
            entity.add(TrackableComponent);
            expect(query.get()).toContain(entity);

            const component = entity.get(TrackableComponent)!;
            entity.remove(component); // This will call _candidacy -> world.entityCompositionChanged

            expect(query.get()).not.toContain(entity);
        });
    });

    describe('entityWasDestroyed (formerly _destroyed)', () => {
        let entity: Entity;
        let entityId: string;

        beforeEach(() => {
            entity = world.createEntity();
            entityId = entity.id;
        });

        it('should return true and remove entity if entity exists', () => {
            expect(world.getEntity(entityId)).toBe(entity);
            const result = world.entityWasDestroyed(entityId);
            expect(result).toBe(true);
            expect(world.getEntity(entityId)).toBeUndefined();
        });

        it('should return false if entity does not exist', () => {
            const result = world.entityWasDestroyed('nonExistentId');
            expect(result).toBe(false);
        });

        it('should not affect other entities', () => {
            const anotherEntity = world.createEntity();
            world.entityWasDestroyed(entityId);
            expect(world.getEntity(anotherEntity.id)).toBe(anotherEntity);
        });
    });
});
