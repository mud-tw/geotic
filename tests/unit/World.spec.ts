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
});
