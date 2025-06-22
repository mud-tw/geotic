import { Engine, Component, World, Entity, Query, ComponentClass, ComponentClassWithCBit, QuerySubscription } from '../../src'; // Adjusted path
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

    describe('observe() method - Reactive Queries', () => {
        let queryAllA: Query;
        let entityX: Entity, entityY: Entity;
        let onEnterMock: jest.Mock, onExitMock: jest.Mock;

        beforeEach(() => {
            // ComponentA (CompA) is already registered in the outer scope's beforeEach
            queryAllA = world.createQuery({ all: [CompA] });
            entityX = world.createEntity('entityX');
            entityY = world.createEntity('entityY');
            onEnterMock = jest.fn();
            onExitMock = jest.fn();
        });

        it('should call onEnter when an entity starts matching after subscription', () => {
            queryAllA.observe({ onEnter: onEnterMock, onExit: onExitMock });
            entityX.add(ComponentA);
            expect(onEnterMock).toHaveBeenCalledTimes(1);
            expect(onEnterMock).toHaveBeenCalledWith(entityX);
            expect(onExitMock).not.toHaveBeenCalled();
        });

        it('should call onExit when a matching entity stops matching after subscription', () => {
            entityX.add(ComponentA);
            queryAllA.observe({ onEnter: onEnterMock, onExit: onExitMock });
            entityX.get(ComponentA)!.destroy();
            expect(onExitMock).toHaveBeenCalledTimes(1);
            expect(onExitMock).toHaveBeenCalledWith(entityX);
            expect(onEnterMock).not.toHaveBeenCalled();
        });

        it('should call onExit when a matching entity is destroyed', () => {
            entityX.add(ComponentA);
            queryAllA.observe({ onEnter: onEnterMock, onExit: onExitMock });
            entityX.destroy();
            expect(onExitMock).toHaveBeenCalledTimes(1);
            expect(onExitMock).toHaveBeenCalledWith(entityX);
            expect(onEnterMock).not.toHaveBeenCalled();
        });

        it('should call onEnter for pre-existing entities when options.emitCurrent is true', () => {
            entityX.add(ComponentA);
            entityY.add(ComponentA);
            queryAllA.observe({ onEnter: onEnterMock }, { emitCurrent: true });
            expect(onEnterMock).toHaveBeenCalledTimes(2);
            expect(onEnterMock).toHaveBeenCalledWith(entityX);
            expect(onEnterMock).toHaveBeenCalledWith(entityY);
        });

        it('should NOT call onEnter for pre-existing entities when options.emitCurrent is false', () => {
            entityX.add(ComponentA);
            queryAllA.observe({ onEnter: onEnterMock }, { emitCurrent: false });
            expect(onEnterMock).not.toHaveBeenCalled();
        });

        it('should default to emitCurrent: false if options or emitCurrent is not provided', () => {
            entityX.add(ComponentA);
            queryAllA.observe({ onEnter: onEnterMock }); // No options
            expect(onEnterMock).not.toHaveBeenCalled();

            const onEnterMock2 = jest.fn();
            queryAllA.observe({ onEnter: onEnterMock2 }, {}); // Empty options
            expect(onEnterMock2).not.toHaveBeenCalled();
        });

        describe('unsubscription', () => {
            let subscription: QuerySubscription;

            it('unsubscribe() should prevent future notifications for that observer', () => {
                subscription = queryAllA.observe({ onEnter: onEnterMock, onExit: onExitMock });
                subscription.unsubscribe();
                entityX.add(ComponentA);
                expect(onEnterMock).not.toHaveBeenCalled();
                expect(subscription.closed).toBe(true);
            });

            it('unsubscribing one observer should not affect other observers', () => {
                const anotherOnEnter = jest.fn();
                const sub1 = queryAllA.observe({ onEnter: onEnterMock });
                const sub2 = queryAllA.observe({ onEnter: anotherOnEnter });

                sub1.unsubscribe();
                entityX.add(ComponentA);

                expect(onEnterMock).not.toHaveBeenCalled();
                expect(anotherOnEnter).toHaveBeenCalledTimes(1);
                expect(anotherOnEnter).toHaveBeenCalledWith(entityX);
            });

            it('calling unsubscribe() multiple times should be safe', () => {
                subscription = queryAllA.observe({ onEnter: onEnterMock });
                subscription.unsubscribe();
                expect(() => subscription.unsubscribe()).not.toThrow();
            });

            it('should handle unsubscription from within an onEnter callback', () => {
                let sub: QuerySubscription;
                const onEnterWithUnsubscribe = jest.fn(() => {
                    sub.unsubscribe();
                });
                sub = queryAllA.observe({ onEnter: onEnterWithUnsubscribe });

                entityX.add(ComponentA);
                expect(onEnterWithUnsubscribe).toHaveBeenCalledTimes(1);

                entityY.add(ComponentA);
                expect(onEnterWithUnsubscribe).toHaveBeenCalledTimes(1);
            });

            it('should handle unsubscription from within an onExit callback', () => {
                let sub: QuerySubscription;
                const onExitWithUnsubscribe = jest.fn(() => {
                    sub.unsubscribe();
                });
                entityX.add(ComponentA);
                entityY.add(ComponentA);
                sub = queryAllA.observe({ onExit: onExitWithUnsubscribe });

                entityX.get(ComponentA)!.destroy();
                expect(onExitWithUnsubscribe).toHaveBeenCalledTimes(1);

                entityY.get(ComponentA)!.destroy();
                expect(onExitWithUnsubscribe).toHaveBeenCalledTimes(1);
            });
        });
    });
});
