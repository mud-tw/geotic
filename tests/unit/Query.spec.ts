import { Engine, Component, World, Entity, Query, ComponentClass, ComponentClassWithCBit } from '../../src'; // Adjusted path
// Removed unused import: import { bitIntersection } from '../../src/util/bit-util';

describe('Query', () => {
    let world: World;
    let entity: Entity;
    let query: Query; // query will be redefined in tests, so keep it more general or re-type in each block
    let engine: Engine; // Added engine

    class ComponentA extends Component {}
    class ComponentB extends Component {}
    class ComponentC extends Component {}

    // Helper to cast to ComponentClassWithCBit for query filters
    const CompA = ComponentA as unknown as ComponentClassWithCBit;
    const CompB = ComponentB as unknown as ComponentClassWithCBit;
    const CompC = ComponentC as unknown as ComponentClassWithCBit;

    beforeEach(() => {
        engine = new Engine(); // Initialize engine

        engine.registerComponent(ComponentA as ComponentClass);
        engine.registerComponent(ComponentB as ComponentClass);
        engine.registerComponent(ComponentC as ComponentClass);

        world = engine.createWorld();
        entity = world.createEntity();
    });

    describe('any', () => {
        it('should return false for an empty entity', () => {
            query = world.createQuery({
                any: [CompA],
            });
            expect(query.has(entity)).toBe(false);
        });

        it('should return true if the entity has it', () => {
            query = world.createQuery({
                any: [CompA],
            });
            entity.add(ComponentA);
            expect(query.has(entity)).toBe(true);
        });

        it('should return true if the entity has at least one of them', () => {
            query = world.createQuery({
                any: [CompA, CompB, CompC],
            });
            entity.add(ComponentC);
            expect(query.has(entity)).toBe(true);
        });

        it('should return false if the entity does not have it', () => {
            query = world.createQuery({
                any: [CompA],
            });
            entity.add(ComponentB);
            expect(query.has(entity)).toBe(false);
        });
    });

    describe('all', () => {
        it('should return false for an empty entity', () => {
            query = world.createQuery({
                all: [CompA],
            });
            expect(query.has(entity)).toBe(false);
        });

        it('should return true if the entity has it', () => {
            query = world.createQuery({
                all: [CompA],
            });
            entity.add(ComponentA);
            expect(query.has(entity)).toBe(true);
        });

        it('should return true if the entity has all of them', () => {
            query = world.createQuery({
                all: [CompA, CompB, CompC],
            });
            entity.add(ComponentA);
            entity.add(ComponentB);
            entity.add(ComponentC);
            expect(query.has(entity)).toBe(true);
        });

        it('should return false if the entity is missing one of them', () => {
            query = world.createQuery({
                all: [CompA, CompB, CompC],
            });
            entity.add(ComponentA);
            entity.add(ComponentB);
            expect(query.has(entity)).toBe(false);
        });
    });

    describe('none', () => {
        it('should return true for an empty entity', () => {
            query = world.createQuery({
                none: [CompA],
            });
            expect(query.has(entity)).toBe(true);
        });

        it('should return false if the entity has it', () => {
            query = world.createQuery({
                none: [CompA],
            });
            entity.add(ComponentA);
            expect(query.has(entity)).toBe(false);
        });

        it('should return false if the entity has all of them', () => {
            query = world.createQuery({
                none: [CompA, CompB, CompC],
            });
            entity.add(ComponentA);
            entity.add(ComponentB);
            entity.add(ComponentC);
            expect(query.has(entity)).toBe(false);
        });

        // This test seems logically flawed based on "none" behavior or has a confusing name.
        // If entity has A and B, and "none" is [A,B,C], it should be false.
        // If "none" is [C] and entity has A,B, it should be true.
        // Assuming the intent was: "should be true if entity does not have any of the 'none' components"
        it('should be true if entity has components not in the "none" list', () => {
            query = world.createQuery({
                none: [CompC], // Entity should not have CompC
            });
            entity.add(ComponentA); // Has A
            entity.add(ComponentB); // Has B
            expect(query.has(entity)).toBe(true); // Does not have C, so true
        });


        it('should return false if the entity has one of them', () => {
            query = world.createQuery({
                none: [CompA, CompB, CompC],
            });
            entity.add(ComponentA);
            expect(query.has(entity)).toBe(false);
        });
    });

    describe('combinations', () => {
        it('any:[A], all:[B,C] -> entity(A,B,C) should be true', () => {
            query = world.createQuery({
                any: [CompA],
                all: [CompB, CompC],
            });
            entity.add(ComponentA);
            entity.add(ComponentB);
            entity.add(ComponentC);
            expect(query.has(entity)).toBe(true);
        });

        it('any:[A,B], all:[C] -> entity(A,C) should be true', () => {
            query = world.createQuery({
                any: [CompA, CompB],
                all: [CompC],
            });
            entity.add(ComponentA);
            entity.add(ComponentC);
            expect(query.has(entity)).toBe(true);
        });

        it('any:[A,B], none:[C] -> entity(A,B) should be true', () => {
            query = world.createQuery({
                any: [CompA, CompB],
                none: [CompC],
            });
            entity.add(ComponentA);
            entity.add(ComponentB);
            expect(query.has(entity)).toBe(true);
        });

        it('any:[A], all:[B,C] -> entity(A,B) should be false', () => {
            query = world.createQuery({
                any: [CompA],
                all: [CompB, CompC], // Missing C
            });
            entity.add(ComponentA);
            entity.add(ComponentB);
            expect(query.has(entity)).toBe(false);
        });

        it('any:[A,B], all:[C] -> entity(C) should be false', () => {
            query = world.createQuery({
                any: [CompA, CompB], // Missing A or B
                all: [CompC],
            });
            entity.add(ComponentC);
            expect(query.has(entity)).toBe(false);
        });

        it('any:[A,B], none:[C] -> entity(A,B,C) should be false', () => {
            query = world.createQuery({
                any: [CompA, CompB],
                none: [CompC], // Has C, so should be false
            });
            entity.add(ComponentA);
            entity.add(ComponentB);
            entity.add(ComponentC);
            expect(query.has(entity)).toBe(false);
        });
    });

    describe('callbacks', () => {
        let onAddedCb1: jest.Mock;
        let onAddedCb2: jest.Mock;
        let onRemovedCb1: jest.Mock;
        let onRemovedCb2: jest.Mock;

        beforeEach(() => {
            query = world.createQuery({
                any: [CompA],
            });

            onAddedCb1 = jest.fn();
            onAddedCb2 = jest.fn();
            onRemovedCb1 = jest.fn();
            onRemovedCb2 = jest.fn();

            query.onEntityAdded(onAddedCb1);
            query.onEntityAdded(onAddedCb2);
            query.onEntityRemoved(onRemovedCb1);
            query.onEntityRemoved(onRemovedCb2);
        });

        it('should invoke onEntityAdded callbacks when an entity matches and is added', () => {
            entity.add(ComponentA);
            expect(onAddedCb1).toHaveBeenCalledTimes(1);
            expect(onAddedCb1).toHaveBeenCalledWith(entity);
            expect(onAddedCb2).toHaveBeenCalledTimes(1);
            expect(onAddedCb2).toHaveBeenCalledWith(entity);
        });

        it('should invoke onEntityRemoved callbacks when a tracked entity no longer matches', () => {
            entity.add(ComponentA); // Tracked
            (entity as any).componentA.destroy(); // No longer matches

            expect(onRemovedCb1).toHaveBeenCalledTimes(1);
            expect(onRemovedCb1).toHaveBeenCalledWith(entity);
            expect(onRemovedCb2).toHaveBeenCalledTimes(1);
            expect(onRemovedCb2).toHaveBeenCalledWith(entity);
        });

        it('should invoke onEntityRemoved callbacks when a tracked entity is destroyed', () => {
            entity.add(ComponentA); // Tracked
            entity.destroy(); // Entity destroyed

            expect(onRemovedCb1).toHaveBeenCalledTimes(1);
            expect(onRemovedCb1).toHaveBeenCalledWith(entity); // The entity instance is passed
            expect(onRemovedCb2).toHaveBeenCalledTimes(1);
            expect(onRemovedCb2).toHaveBeenCalledWith(entity);
        });
    });

    describe('get() method and immutableResult option', () => {
        beforeEach(() => {
            entity.add(ComponentA); // Make entity match a simple query
        });

        it('should return a copy of results when immutableResult is true (default)', () => {
            query = world.createQuery({ all: [CompA], immutableResult: true });
            const results1 = query.get();
            expect(results1).toContain(entity);
            results1.pop(); // Modify the returned array
            expect(query.get()).toContain(entity); // Internal cache should be unaffected
        });

        it('should return a direct reference to results when immutableResult is false', () => {
            query = world.createQuery({ all: [CompA], immutableResult: false });
            const results1 = query.get();
            expect(results1).toContain(entity);
            results1.pop(); // Modify the returned array
            expect(query.get()).not.toContain(entity); // Internal cache should be affected
        });

        it('should default to immutableResult: true if option is not provided', () => {
            query = world.createQuery({ all: [CompA] }); // immutableResult is undefined
            const results1 = query.get();
            expect(results1).toContain(entity);
            results1.pop();
            expect(query.get()).toContain(entity);
        });
    });

    describe('edge cases', () => {
        it('should match all non-destroyed entities if filters are empty', () => {
            query = world.createQuery({});
            const entityB = world.createEntity();
            entity.add(ComponentA); // Add some components to make them different
            entityB.add(ComponentB);

            expect(query.get()).toContain(entity);
            expect(query.get()).toContain(entityB);

            entity.destroy();
            expect(query.get()).not.toContain(entity);
            expect(query.get()).toContain(entityB);
        });

        it('should return an empty array for an empty world', () => {
            const emptyWorld = engine.createWorld();
            query = emptyWorld.createQuery({all: [CompA]});
            expect(query.get()).toEqual([]);
        });
        // TODO: Test candidate() method's boolean return value directly in various scenarios.
    });

    describe('observe() method - Reactive Queries', () => {
        let queryAllA: Query;
        let entityX: Entity, entityY: Entity;
        let onEnterMock: jest.Mock;
        let onExitMock: jest.Mock;

        beforeEach(() => {
            // ComponentA (CompA_Query) is already registered in the outer scope's beforeEach
            queryAllA = world.createQuery({ all: [CompA] });
            entityX = world.createEntity('entityX');
            entityY = world.createEntity('entityY');
            onEnterMock = jest.fn();
            onExitMock = jest.fn();
        });

        it('should call onEnter when an entity starts matching after subscription', () => {
            queryAllA.observe({ onEnter: onEnterMock, onExit: onExitMock });

            expect(onEnterMock).not.toHaveBeenCalled(); // Initially, entityX doesn't match

            entityX.add(ComponentA); // entityX now matches and should trigger onEnter

            expect(onEnterMock).toHaveBeenCalledTimes(1);
            expect(onEnterMock).toHaveBeenCalledWith(entityX);
            expect(onExitMock).not.toHaveBeenCalled();
        });

        it('should call onExit when a matching entity stops matching after subscription', () => {
            entityX.add(ComponentA); // entityX matches initially
            // At this point, if observe was called before add, onEnter would have fired.
            // For this test, we subscribe *after* it's already in a matching state (if emitCurrent=false).
            // Or, to be cleaner, ensure it's in the query, then subscribe, then make it exit.

            // To ensure entityX is in the query's cache for the "exit" part to be meaningful
            // we can call get() once (which happens if emitCurrent is not used, after refresh).
            // Or, more simply, just add it and then observe.
            // The internal refresh on query creation handles initial population.
            expect(queryAllA.get()).toContain(entityX); // Verify it's in the query due to constructor's refresh

            queryAllA.observe({ onEnter: onEnterMock, onExit: onExitMock });

            // onEnter should not be called for pre-existing entities unless emitCurrent is true
            expect(onEnterMock).not.toHaveBeenCalled();

            const compA_instance = entityX.get(ComponentA);
            expect(compA_instance).toBeDefined();
            if (compA_instance) {
                entityX.remove(compA_instance); // entityX no longer matches
            }

            expect(onExitMock).toHaveBeenCalledTimes(1);
            expect(onExitMock).toHaveBeenCalledWith(entityX);
            expect(onEnterMock).not.toHaveBeenCalled(); // Ensure onEnter wasn't called again
        });

        it('should call onExit when a matching entity is destroyed', () => {
            entityX.add(ComponentA);
            expect(queryAllA.get()).toContain(entityX);

            queryAllA.observe({ onEnter: onEnterMock, onExit: onExitMock });
            expect(onEnterMock).not.toHaveBeenCalled();

            entityX.destroy(); // Entity is destroyed

            expect(onExitMock).toHaveBeenCalledTimes(1);
            expect(onExitMock).toHaveBeenCalledWith(entityX);
        });

        it('should call onEnter for pre-existing entities when options.emitCurrent is true', () => {
            entityX.add(ComponentA); // entityX matches queryAllA
            entityY.add(ComponentB); // entityY does not match queryAllA

            queryAllA.observe({ onEnter: onEnterMock, onExit: onExitMock }, { emitCurrent: true });

            expect(onEnterMock).toHaveBeenCalledTimes(1);
            expect(onEnterMock).toHaveBeenCalledWith(entityX);
            expect(onExitMock).not.toHaveBeenCalled();

            // Ensure subsequent changes are still handled
            onEnterMock.mockClear(); // Clear mocks for next assertion
            entityY.add(ComponentA); // entityY now matches
            expect(onEnterMock).toHaveBeenCalledTimes(1);
            expect(onEnterMock).toHaveBeenCalledWith(entityY);
        });

        it('should NOT call onEnter for pre-existing entities when options.emitCurrent is false', () => {
            entityX.add(ComponentA); // entityX matches queryAllA

            queryAllA.observe({ onEnter: onEnterMock, onExit: onExitMock }, { emitCurrent: false });

            expect(onEnterMock).not.toHaveBeenCalled();
            expect(onExitMock).not.toHaveBeenCalled();

            // Ensure subsequent changes are still handled
            const entityZ = world.createEntity('entityZ');
            entityZ.add(ComponentA); // entityZ now matches
            expect(onEnterMock).toHaveBeenCalledTimes(1);
            expect(onEnterMock).toHaveBeenCalledWith(entityZ);
        });

        it('should default to emitCurrent: false if options object is not provided', () => {
            entityX.add(ComponentA); // pre-existing entity
            queryAllA.observe({ onEnter: onEnterMock });

            // 不應該為已存在的實體呼叫
            expect(onEnterMock).not.toHaveBeenCalled();

            // 應該為新的實體呼叫
            const entityZ = world.createEntity('entityZ');
            entityZ.add(ComponentA);
            expect(onEnterMock).toHaveBeenCalledTimes(1);
            expect(onEnterMock).toHaveBeenCalledWith(entityZ);
        });

        it('should default to emitCurrent: false if emitCurrent is not in options', () => {
            entityX.add(ComponentA); // pre-existing entity
            queryAllA.observe({ onEnter: onEnterMock }, {}); // empty options
            expect(onEnterMock).not.toHaveBeenCalled(); // 不應該為已存在的實體呼叫
        });

        // More tests for unsubscription, multiple observers will be added later.

        describe('unsubscription', () => {
            it('unsubscribe() should prevent future notifications for that observer', () => {
                const subscription = queryAllA.observe({ onEnter: onEnterMock, onExit: onExitMock });

                entityX.add(ComponentA); // Trigger onEnter
                expect(onEnterMock).toHaveBeenCalledTimes(1);
                expect(onEnterMock).toHaveBeenCalledWith(entityX);
                onEnterMock.mockClear();

                subscription.unsubscribe();
                expect(subscription.closed).toBe(true);

                // This entity should not trigger onEnter for the unsubscribed observer
                entityY.add(ComponentA);
                expect(onEnterMock).not.toHaveBeenCalled();

                // Also test onExit
                const compA_instance = entityX.get(ComponentA); // entityX was added before unsubscribe
                if (compA_instance) entityX.remove(compA_instance); // Should not trigger onExit for unsubscribed
                expect(onExitMock).not.toHaveBeenCalled();
            });

            it('unsubscribing one observer should not affect other observers', () => {
                const onEnterMockB = jest.fn();
                const onExitMockB = jest.fn();

                const subscriptionA = queryAllA.observe({ onEnter: onEnterMock, onExit: onExitMock });
                const subscriptionB = queryAllA.observe({ onEnter: onEnterMockB, onExit: onExitMockB });

                subscriptionA.unsubscribe();
                expect(subscriptionA.closed).toBe(true);
                expect(subscriptionB.closed).toBe(false);

                entityX.add(ComponentA);
                expect(onEnterMock).not.toHaveBeenCalled(); // A is unsubscribed
                expect(onEnterMockB).toHaveBeenCalledTimes(1); // B should still fire
                expect(onEnterMockB).toHaveBeenCalledWith(entityX);

                onEnterMockB.mockClear();

                const compA_instance = entityX.get(ComponentA);
                if (compA_instance) entityX.remove(compA_instance);

                expect(onExitMock).not.toHaveBeenCalled(); // A is unsubscribed
                expect(onExitMockB).toHaveBeenCalledTimes(1); // B should still fire
                expect(onExitMockB).toHaveBeenCalledWith(entityX);
            });

            it('calling unsubscribe() multiple times should be safe', () => {
                const subscription = queryAllA.observe({ onEnter: onEnterMock });
                subscription.unsubscribe();
                expect(subscription.closed).toBe(true);
                expect(() => subscription.unsubscribe()).not.toThrow();
                expect(subscription.closed).toBe(true); // Still closed
            });

            it('should handle unsubscription from within an onEnter callback', () => {
                let subscriptionA: QuerySubscription | null = null;
                const onEnterA = jest.fn(() => {
                    subscriptionA?.unsubscribe();
                });

                const onEnterB = jest.fn();

                subscriptionA = queryAllA.observe({ onEnter: onEnterA });
                const subscriptionB = queryAllA.observe({ onEnter: onEnterB });

                entityX.add(ComponentA); // Triggers onEnterA (which unsubscribes A) and onEnterB

                expect(onEnterA).toHaveBeenCalledTimes(1); // A called once
                expect(onEnterA).toHaveBeenCalledWith(entityX);
                expect(subscriptionA?.closed).toBe(true);

                expect(onEnterB).toHaveBeenCalledTimes(1); // B called once for entityX
                expect(onEnterB).toHaveBeenCalledWith(entityX);


                // Add another entity, A should not be called, B should be.
                onEnterA.mockClear();
                onEnterB.mockClear();

                entityY.add(ComponentA);
                expect(onEnterA).not.toHaveBeenCalled(); // A is unsubscribed
                expect(onEnterB).toHaveBeenCalledTimes(1); // B still active
                expect(onEnterB).toHaveBeenCalledWith(entityY);
                expect(subscriptionB.closed).toBe(false);
            });

            it('should handle unsubscription from within an onExit callback', () => {
                let subscriptionA: QuerySubscription | null = null;
                const onExitA = jest.fn(() => {
                    subscriptionA?.unsubscribe();
                });
                const onExitB = jest.fn();

                entityX.add(ComponentA); // Both entities match
                entityY.add(ComponentA);

                subscriptionA = queryAllA.observe({ onExit: onExitA });
                const subscriptionB = queryAllA.observe({ onExit: onExitB });

                // Remove first entity
                const compX = entityX.get(ComponentA)!;
                entityX.remove(compX);

                expect(onExitA).toHaveBeenCalledTimes(1);
                expect(onExitA).toHaveBeenCalledWith(entityX);
                expect(subscriptionA?.closed).toBe(true);
                expect(onExitB).toHaveBeenCalledTimes(1);
                expect(onExitB).toHaveBeenCalledWith(entityX);

                // Remove second entity
                onExitA.mockClear();
                onExitB.mockClear();
                const compY = entityY.get(ComponentA)!;
                entityY.remove(compY);

                expect(onExitA).not.toHaveBeenCalled(); // A is unsubscribed
                expect(onExitB).toHaveBeenCalledTimes(1);
                expect(onExitB).toHaveBeenCalledWith(entityY);
                expect(subscriptionB.closed).toBe(false);
            });
        });
    });
});
