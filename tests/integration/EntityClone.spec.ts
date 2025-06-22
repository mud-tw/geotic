import { Engine, World, Entity, ComponentClass } from '../../src'; // Adjusted path
import {
    EmptyComponent,
    SimpleComponent,
    NestedComponent,
    ArrayComponent,
} from '../data/components'; // Adjusted path

// Use global chance instance if available
declare const chance: Chance.Chance;

describe('Entity Clone Integration Test', () => { // Renamed for clarity
    let world: World;
    let engine: Engine; // Added engine

    beforeEach(() => {
        engine = new Engine(); // Initialize engine

        engine.registerComponent(EmptyComponent as ComponentClass);
        engine.registerComponent(SimpleComponent as ComponentClass);
        engine.registerComponent(NestedComponent as ComponentClass);
        engine.registerComponent(ArrayComponent as ComponentClass);

        world = engine.createWorld();
    });

    describe('clone', () => {
        let entity: Entity;
        let nestedKeyA: string, nestedKeyB: string;
        let initialSimpleProp: string;
        let initialArrayName1: string, initialArrayName2: string;


        beforeEach(() => {
            nestedKeyA = chance.word();
            nestedKeyB = chance.word();
            initialSimpleProp = chance.string();
            initialArrayName1 = chance.word();
            initialArrayName2 = chance.word();

            entity = world.createEntity();
            entity.add(EmptyComponent);
            entity.add(SimpleComponent, { testProp: initialSimpleProp });
            entity.add(ArrayComponent, { name: initialArrayName1 });
            entity.add(ArrayComponent, { name: initialArrayName2 });
            entity.add(NestedComponent, { name: nestedKeyA });
            entity.add(NestedComponent, { name: nestedKeyB });
        });

        it('should clone component data and assign new id', () => {
            const clone: Entity = entity.clone();

            // Verify ID is different
            expect(clone.id).not.toEqual(entity.id);
            expect(typeof clone.id).toBe('string');

            // Verify components are present on clone
            expect(clone.has(EmptyComponent)).toBe(true);
            expect(clone.has(SimpleComponent)).toBe(true);
            expect(clone.has(ArrayComponent)).toBe(true);
            expect(clone.has(NestedComponent)).toBe(true);

            // Verify specific component data
            const simpleClone = (clone as any).simpleComponent as SimpleComponent;
            expect(simpleClone.testProp).toEqual(initialSimpleProp);

            const arrayClone = (clone as any).arrayComponent as ArrayComponent[];
            expect(arrayClone).toHaveLength(2);
            expect(arrayClone.find(c => c.name === initialArrayName1)).toBeDefined();
            expect(arrayClone.find(c => c.name === initialArrayName2)).toBeDefined();

            const nestedClone = (clone as any).nestedComponent as Record<string, NestedComponent>;
            expect(nestedClone[nestedKeyA]).toBeDefined();
            expect(nestedClone[nestedKeyB]).toBeDefined();
            expect(nestedClone[nestedKeyA].name).toBe(nestedKeyA);
            expect(nestedClone[nestedKeyB].name).toBe(nestedKeyB);

            // Compare serialized data (excluding ID)
            const entityJson = entity.serialize();
            const cloneJson = clone.serialize();

            expect({
                ...cloneJson, // Use cloneJson first as its ID is what we expect to be different
                id: null, // Nullify ID for comparison
            }).toEqual({
                ...entityJson,
                id: null, // Nullify ID for comparison
            });

            // TODO: Explicitly test deep cloning:
            // Modify a nested property in a component of the *original* entity
            // (e.g., entity.nestedComponent[nestedKeyA].obprop.arr.push(99))
            // and assert that the *cloned* entity's corresponding property is *not* affected.
        });

        // TODO: Test cloning an entity with no components.
        // TODO: Test that a cloned entity is correctly picked up by relevant queries.
    });
});
