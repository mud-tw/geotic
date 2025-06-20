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
});
