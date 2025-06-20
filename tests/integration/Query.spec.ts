import { Engine, Component, World, Entity, Query, ComponentClass, ComponentClassWithCBit, QueryFilters } from '../../src'; // Adjusted path

describe('Query Integration Test', () => { // Renamed for clarity
    let world: World;
    let entityA: Entity, entityB: Entity;
    let query: Query;
    let onAddCallback: jest.Mock;
    let onRemoveCallback: jest.Mock;
    let engine: Engine; // Added engine

    // Define simple components for testing queries
    class ComponentA extends Component {}
    class ComponentB extends Component {}
    class ComponentC extends Component {}

    // Helper casts for query filters
    const CompA_Query = ComponentA as unknown as ComponentClassWithCBit;
    const CompB_Query = ComponentB as unknown as ComponentClassWithCBit;
    // const CompC_Query = ComponentC as unknown as ComponentClassWithCBit; // If needed

    beforeEach(() => {
        engine = new Engine(); // Initialize engine

        engine.registerComponent(ComponentA as ComponentClass);
        engine.registerComponent(ComponentB as ComponentClass);
        engine.registerComponent(ComponentC as ComponentClass);

        world = engine.createWorld();

        entityA = world.createEntity('entityA'); // Optional IDs for easier debugging
        entityB = world.createEntity('entityB');

        onAddCallback = jest.fn();
        onRemoveCallback = jest.fn();
    });

    describe('when there are no matching entities initially', () => {
        beforeEach(() => {
            const filters: QueryFilters = { any: [CompA_Query] };
            query = world.createQuery(filters);
            query.onEntityAdded(onAddCallback);
            query.onEntityRemoved(onRemoveCallback);
        });

        it('should return an empty array from get()', () => {
            const result: Entity[] = query.get();
            expect(result).toEqual([]);
        });

        it('should not invoke any callbacks yet', () => {
            expect(onAddCallback).not.toHaveBeenCalled();
            expect(onRemoveCallback).not.toHaveBeenCalled();
        });

        describe('when an entity is created that matches', () => {
            let newEntity: Entity;
            beforeEach(() => {
                newEntity = world.createEntity('newEntity');
                newEntity.add(ComponentA); // Matches query { any: [CompA_Query] }
            });

            it('should be included in result set', () => {
                const result: Entity[] = query.get();
                expect(result).toEqual([newEntity]);
            });

            it('should invoke the onAddCallback with the new entity', () => {
                expect(onAddCallback).toHaveBeenCalledTimes(1);
                expect(onAddCallback).toHaveBeenCalledWith(newEntity);
                expect(onRemoveCallback).not.toHaveBeenCalled();
            });
        });

        describe('when an existing entity is modified to match', () => {
            beforeEach(() => {
                // entityA initially does not match
                entityA.add(ComponentA); // Now entityA matches
            });

            it('should be included in result set', () => {
                const result: Entity[] = query.get();
                // Order might not be guaranteed, use toContainEqual or sort if necessary
                expect(result).toEqual([entityA]);
            });

            it('should invoke the onAddCallback with the matching entity', () => {
                expect(onAddCallback).toHaveBeenCalledTimes(1);
                expect(onAddCallback).toHaveBeenCalledWith(entityA);
                expect(onRemoveCallback).not.toHaveBeenCalled();
            });
        });
    });

    describe('when there are matching entities initially', () => {
        beforeEach(() => {
            entityA.add(ComponentA);
            entityB.add(ComponentA);

            const filters: QueryFilters = { any: [CompA_Query] };
            query = world.createQuery(filters); // Query created after entities match
            query.onEntityAdded(onAddCallback); // Callbacks added after entities match
            // Note: onAdd for existing entities is typically handled by query.refresh() or initial population.
            // The current Query implementation calls refresh() in constructor, so they should be in cache.
            // However, onEntityAdded callbacks are only fired for entities added *after* the callback is registered.
            // To test this properly, we might need to add entities after query.onEntityAdded is set,
            // or adjust expectations if onEntityAdded is meant to fire for pre-existing entities upon registration (which is less common).
            // For now, let's assume onAddCallback won't be called for entityA, entityB in this specific `beforeEach`.
        });

        it('should return a set including the initially matching entities', () => {
            const result: Entity[] = query.get();
            // Use expect.arrayContaining for order-insensitivity if order is not guaranteed
            expect(result).toEqual(expect.arrayContaining([entityA, entityB]));
            expect(result).toHaveLength(2);
        });

        it('onEntityAdded callbacks should NOT have been called for pre-existing entities', () => {
            // Based on typical event listener patterns, callbacks are for future events.
             expect(onAddCallback).not.toHaveBeenCalled();
        });


        describe('when an entity is modified to no longer match', () => {
            beforeEach(() => {
                // Ensure entityA was part of the query
                expect(query.get()).toContain(entityA);
                // Now remove the component that made it match
                ((entityA as any).componentA as Component).destroy();
            });

            it('should not be included in result set', () => {
                const result: Entity[] = query.get();
                expect(result).toEqual([entityB]); // Only entityB should remain
            });

            it('should invoke the onRemoveCallback with the removed entity', () => {
                expect(onRemoveCallback).toHaveBeenCalledTimes(1);
                expect(onRemoveCallback).toHaveBeenCalledWith(entityA);
            });
        });

        describe('when an entity is destroyed', () => {
            beforeEach(() => {
                expect(query.get()).toContain(entityA);
                entityA.destroy();
            });

            it('should not be included in result set', () => {
                const result: Entity[] = query.get();
                expect(result).toEqual([entityB]);
            });

            it('should invoke the onRemoveCallback with the destroyed entity', () => {
                expect(onRemoveCallback).toHaveBeenCalledTimes(1);
                expect(onRemoveCallback).toHaveBeenCalledWith(entityA);
            });
        });
    });

    describe('immutableResult query option', () => {
        describe('when immutableResult is true (default or explicit)', () => {
            beforeEach(() => {
                entityA.add(ComponentA);
                entityB.add(ComponentA);
                const filters: QueryFilters = { any: [CompA_Query], immutableResult: true };
                query = world.createQuery(filters);
            });

            it('should not modify the query internal cache when the returned array is modified', () => {
                const result1: Entity[] = query.get();
                expect(result1).toHaveLength(2);
                result1.splice(0, 1); // Modify the returned array

                const result2: Entity[] = query.get(); // Get a fresh array
                expect(result2).toHaveLength(2); // Internal cache should be unaffected
                expect(result1).not.toBe(result2); // Should be different array instances
            });
        });

        describe('when immutableResult is false', () => {
            beforeEach(() => {
                entityA.add(ComponentA);
                entityB.add(ComponentA);
                const filters: QueryFilters = { any: [CompA_Query], immutableResult: false };
                query = world.createQuery(filters);
            });

            it('should reflect modifications to the returned array in subsequent gets (direct cache mutation)', () => {
                const result1: Entity[] = query.get();
                expect(result1).toHaveLength(2);
                result1.splice(0, 1); // Modify the returned array (which is the cache itself)

                const result2: Entity[] = query.get(); // Get the cache again
                expect(result2).toHaveLength(1);
                expect(result1).toBe(result2); // Should be the same array instance
            });
        });
    });
});
