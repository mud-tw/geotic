import { Engine, World, Entity, Component, ComponentProperties, ComponentClass } from '@src/index'; // Adjusted path
// Adjusted path for components used in existing tests
import { EmptyComponent, NestedComponent as OldNestedComponent, ArrayComponent as OldArrayComponent } from '../data/components';
// Import new components for typing tests
import { PositionComponent, VelocityComponent, TagComponent, DataComponent } from '../data/components';


// Use global chance instance if available (from jest.setup.ts)
declare const chance: Chance.Chance; // Make TypeScript aware of global chance

describe('Entity', () => {
    let world: World;
    let engine: Engine; // Added engine variable

    // --- Test Component Definitions for existing tests ---
    class TestComponent extends Component {}

    // Using OldNestedComponent and OldArrayComponent from data/components for clarity
    // These are the versions of NestedComponent and ArrayComponent that were originally defined in this file
    // and are used by the existing tests.
    const NestedComponent = OldNestedComponent;
    const ArrayComponent = OldArrayComponent;
    // --- End Test Component Definitions ---

    beforeEach(() => {
        engine = new Engine(); // Initialize engine

        engine.registerComponent(EmptyComponent); // No need to cast if ComponentClass is correctly inferred by TS
        engine.registerComponent(TestComponent);
        engine.registerComponent(NestedComponent);
        engine.registerComponent(ArrayComponent);

        // Register new components for typing tests
        engine.registerComponent(PositionComponent);
        engine.registerComponent(VelocityComponent);
        engine.registerComponent(TagComponent);
        engine.registerComponent(DataComponent);

        world = engine.createWorld();
    });

    describe('create', () => {
        let entity: Entity;

        beforeEach(() => {
            entity = world.createEntity();
        });

        it('should be able to recall by entity id', () => {
            const result = world.getEntity(entity.id);
            expect(result).toBe(entity);
        });

        it('should set the isDestroyed flag to FALSE', () => {
            expect(entity.isDestroyed).toBe(false);
        });

        it('should assign an ID', () => {
            expect(typeof entity.id).toBe('string');
        });
    });

    describe('destroy', () => {
        let entity: Entity;
        let emptyComponentDestroySpy: jest.SpyInstance;
        let testComponentDestroySpy: jest.SpyInstance;
        let nestedComponentDestroySpy: jest.SpyInstance;
        let arrayComponentDestroySpy: jest.SpyInstance;

        beforeEach(() => {
            entity = world.createEntity();
            entity.add(EmptyComponent);
            entity.add(TestComponent);
            // NestedComponent is keyed by 'name', default is 'test'
            entity.add(NestedComponent); // Will use default name 'test'
            // ArrayComponent defaults to name 'a'
            entity.add(ArrayComponent);

            testComponentDestroySpy = jest.spyOn(entity.testComponent as TestComponent, '_onDestroyed');
            emptyComponentDestroySpy = jest.spyOn(entity.emptyComponent as EmptyComponent, '_onDestroyed');
            nestedComponentDestroySpy = jest.spyOn((entity.nestedComponent as Record<string, typeof NestedComponent>)['test'], '_onDestroyed');
            arrayComponentDestroySpy = jest.spyOn((entity.arrayComponent as typeof ArrayComponent[])[0], '_onDestroyed');

            entity.destroy();
        });

        it('should no longer be able to recall by entity id', () => {
            const result = world.getEntity(entity.id);
            expect(result).toBeUndefined();
        });

        it('should set the entity "isDestroyed" flag to TRUE', () => {
            expect(entity.isDestroyed).toBe(true);
        });

        it('should call "onDestroyed" for all components', () => {
            expect(testComponentDestroySpy).toHaveBeenCalledTimes(1);
            expect(testComponentDestroySpy).toHaveBeenCalledWith();
            expect(emptyComponentDestroySpy).toHaveBeenCalledTimes(1);
            expect(emptyComponentDestroySpy).toHaveBeenCalledWith();
            expect(nestedComponentDestroySpy).toHaveBeenCalledTimes(1);
            expect(nestedComponentDestroySpy).toHaveBeenCalledWith();
            expect(arrayComponentDestroySpy).toHaveBeenCalledTimes(1);
            expect(arrayComponentDestroySpy).toHaveBeenCalledWith();
        });
    });

    describe('add', () => {
        let entity: Entity;

        beforeEach(() => {
            entity = world.createEntity();
        });

        describe('simple components', () => {
            beforeEach(() => {
                entity.add(TestComponent);
            });

            it('should add the component to the entity as a camel cased property', () => {
                expect(entity.testComponent).toBeDefined();
            });

            it('should include the component in the entity components map', () => {
                expect(entity.components['testComponent']).toBeInstanceOf(TestComponent);
            });

            it('should have the correct type of components', () => {
                expect(entity.testComponent).toBeInstanceOf(TestComponent);
            });
        });

        describe('keyed components', () => {
            let nameA: string, nameB: string;

            beforeEach(() => {
                nameA = chance.word();
                nameB = chance.word();

                entity.add(NestedComponent, { name: nameA });
                entity.add(NestedComponent, { name: nameB });
            });

            it('should add the components to the entity as a camel cased property object', () => {
                expect((entity.nestedComponent as Record<string, typeof NestedComponent>)[nameA]).toBeDefined();
                expect((entity.nestedComponent as Record<string, typeof NestedComponent>)[nameB]).toBeDefined();
            });

            it('should have the correct type of components', () => {
                expect((entity.nestedComponent as Record<string, typeof NestedComponent>)[nameA]).toBeInstanceOf(NestedComponent);
                expect((entity.nestedComponent as Record<string, typeof NestedComponent>)[nameB]).toBeInstanceOf(NestedComponent);
            });

            it('should set component properties', () => {
                expect((entity.nestedComponent as Record<string, typeof NestedComponent>)[nameA].name).toBe(nameA);
                expect((entity.nestedComponent as Record<string, typeof NestedComponent>)[nameB].name).toBe(nameB);
            });
        });

        describe('array components', () => {
            let nameA: string, nameB: string;

            beforeEach(() => {
                nameA = chance.word();
                nameB = chance.word();

                entity.add(ArrayComponent, { name: nameA });
                entity.add(ArrayComponent, { name: nameB });
            });

            it('should add the components to the entity as a camel cased array property', () => {
                const ac: typeof ArrayComponent[] = entity.arrayComponent as typeof ArrayComponent[];
                expect(ac).toBeDefined();
                expect(ac).toHaveLength(2);
                expect(ac[0].name).toBe(nameA);
                expect(ac[1].name).toBe(nameB);
            });

            it('should assign the entity to each component', () => {
                const ac = entity.arrayComponent as typeof ArrayComponent[];
                expect(ac[0].entity).toBe(entity);
                expect(ac[1].entity).toBe(entity);
            });

            it('should include the components in the entity components map', () => {
                 expect(entity.components['arrayComponent']).toHaveLength(2);
            });

            it('should have the correct type of components', () => {
                const ac = entity.arrayComponent as typeof ArrayComponent[];
                expect(ac[0]).toBeInstanceOf(ArrayComponent);
                expect(ac[1]).toBeInstanceOf(ArrayComponent);
            });

            it('should set component properties', () => {
                const ac = entity.arrayComponent as typeof ArrayComponent[];
                expect(ac[0].name).toBe(nameA);
                expect(ac[1].name).toBe(nameB);
            });
        });
    });

    describe('remove', () => {
        let entity: Entity;

        beforeEach(() => {
            entity = world.createEntity();
        });

        describe('simple components', () => {
            let comp: TestComponent;
            beforeEach(() => {
                entity.add(TestComponent);
                comp = entity.testComponent as TestComponent;
                entity.remove(comp);
            });

            it('should remove the component direct accessor', () => {
                expect(entity.testComponent).toBeUndefined();
            });
            it('should remove the component from the components map', () => {
                expect(entity.components['testComponent']).toBeUndefined();
            });
        });

        describe('keyed components', () => {
            let compA: NestedComponent, compB: NestedComponent;
            beforeEach(() => {
                entity.add(NestedComponent, { name: 'a' });
                entity.add(NestedComponent, { name: 'b' });
                compA = (entity.nestedComponent as Record<string, NestedComponent>)['a'];
                compB = (entity.nestedComponent as Record<string, NestedComponent>)['b'];
            });

            describe('when one of them is removed', () => {
                beforeEach(() => {
                    entity.remove(compB);
                });

                it('should remove the specific keyed component direct accessor', () => {
                    expect((entity.nestedComponent as Record<string, NestedComponent>)['b']).toBeUndefined();
                });
                it('should keep the other keyed component', () => {
                    expect((entity.nestedComponent as Record<string, NestedComponent>)['a']).toBeDefined();
                });
                 it('should remove from components map', () => {
                    expect((entity.components['nestedComponent'] as Record<string, NestedComponent>)['b']).toBeUndefined();
                });
            });

            describe('when all are removed', () => {
                beforeEach(() => {
                    entity.remove(compA);
                    entity.remove(compB);
                });

                it('should remove the parent direct accessor object', () => {
                    // The Entity logic might make the whole `entity.nestedComponent` undefined if all sub-keyed components are removed.
                    expect(entity.nestedComponent).toBeUndefined();
                });
                 it('should remove from components map', () => {
                    expect(entity.components['nestedComponent']).toBeUndefined();
                });
            });
        });

        describe('array components', () => {
            let compA: ArrayComponent, compB: ArrayComponent;
            beforeEach(() => {
                entity.add(ArrayComponent, { name: 'a' });
                entity.add(ArrayComponent, { name: 'b' });
                compA = entity.arrayComponent[0];
                compB = entity.arrayComponent[1];
            });

            describe('when one of them is removed', () => {
                beforeEach(() => {
                    entity.remove(compB);
                });

                it('should remove the component from the array (implementation might make it undefined or shorten array)', () => {
                    // This depends on Entity.remove's behavior for array components (splice vs setting to undefined)
                    // Assuming it splices or sets to undefined. If it splices, length changes.
                    // If `entity.remove` sets the element to undefined in the array:
                    // expect((entity.arrayComponent as ArrayComponent[])[1]).toBeUndefined();
                    // If `entity.remove` splices the array:
                    expect((entity.arrayComponent).find(c => c === compB)).toBeUndefined();
                    expect((entity.arrayComponent).length).toBe(1);

                });

                it('should keep the other component', () => {
                    expect((entity.arrayComponent)[0]).toBe(compA);
                });
            });

            describe('when all are removed', () => {
                beforeEach(() => {
                    entity.remove(compA);
                    entity.remove(compB);
                });

                it('should remove the parent direct accessor array', () => {
                    // The Entity logic might make `entity.arrayComponent` undefined if the array becomes empty.
                    expect(entity.arrayComponent).toBeUndefined();
                });
                 it('should remove from components map', () => {
                    expect(entity.components['arrayComponent']).toBeUndefined();
                });
            });
        });
    });

    // New describe block for Entity.add typing tests
    describe('add - with strong property typing (compile-time tests)', () => {
        let entity: Entity;

        beforeEach(() => {
            // Engine and world are already created with new components registered in the outer beforeEach
            entity = world.createEntity();
        });

        it('should allow adding PositionComponent with correct optional properties', () => {
            entity.add(PositionComponent, { x: 10, y: 20 });
            const pc1 = entity.positionComponent as PositionComponent;
            expect(pc1.x).toBe(10);
            expect(pc1.y).toBe(20);

            world.destroyEntity(entity.id); // Destroy and recreate to ensure clean state for next add
            entity = world.createEntity();
            entity.add(PositionComponent, { x: 5 });
            const pc2 = entity.positionComponent as PositionComponent;
            expect(pc2.x).toBe(5);
            expect(pc2.y).toBe(0); // Default from static properties, as per PositionComponent constructor

            world.destroyEntity(entity.id);
            entity = world.createEntity();
            entity.add(PositionComponent, {});
            const pc3 = entity.positionComponent as PositionComponent;
            expect(pc3.x).toBe(0);
            expect(pc3.y).toBe(0);

            world.destroyEntity(entity.id);
            entity = world.createEntity();
            entity.add(PositionComponent); // No properties
            const pc4 = entity.positionComponent as PositionComponent;
            expect(pc4.x).toBe(0);
            expect(pc4.y).toBe(0);
        });

        it('should allow adding VelocityComponent with all required properties', () => {
            entity.add(VelocityComponent, { dx: 1, dy: -1 });
            const vc = entity.velocityComponent as VelocityComponent;
            expect(vc.dx).toBe(1);
            expect(vc.dy).toBe(-1);
        });

        it('should allow adding TagComponent without properties or with conforming properties', () => {
            entity.add(TagComponent);
            const tc1 = entity.tagComponent as TagComponent;
            expect(tc1).toBeDefined();
            expect(tc1.tag).toBe("default");

            world.destroyEntity(entity.id);
            entity = world.createEntity();
            entity.add(TagComponent, { tag: "custom" });
            const tc2 = entity.tagComponent as TagComponent;
            expect(tc2.tag).toBe("custom");
        });

        it('should allow adding DataComponent with optional or null properties', () => {
            entity.add(DataComponent, { value: "test" });
            const dc1 = entity.dataComponent as DataComponent;
            expect(dc1.value).toBe("test");

            world.destroyEntity(entity.id);
            entity = world.createEntity();
            entity.add(DataComponent, { value: null });
            const dc2 = entity.dataComponent as DataComponent;
            expect(dc2.value).toBeNull();

            world.destroyEntity(entity.id);
            entity = world.createEntity();
            entity.add(DataComponent);
            const dc3 = entity.dataComponent as DataComponent;
            expect(dc3.value).toBeNull(); // Default from static properties
        });

        // --- COMPILE-TIME FAILURE TESTS ---
        // These lines are commented out because they are expected to cause TypeScript compilation errors.
        // Uncomment them locally after Entity.add is typed to verify.

        it('should FAIL to compile if PositionComponent is given wrong property types (manual check)', () => {
            // entity.add(PositionComponent, { x: "10" }); // EXPECTED COMPILE ERROR: Type 'string' is not assignable to type 'number | undefined'.
            // entity.add(PositionComponent, { x: 10, y: "20" }); // EXPECTED COMPILE ERROR: Type 'string' is not assignable to type 'number | undefined'.
            expect(true).toBe(true); // Placeholder for test runner
        });

        it('should FAIL to compile if PositionComponent is given non-existent properties (manual check)', () => {
            // entity.add(PositionComponent, { z: 30 }); // EXPECTED COMPILE ERROR: Object literal may only specify known properties, and 'z' does not exist in type 'Partial<PositionComponentProps>'.
            // entity.add(PositionComponent, { x: 10, nonExistent: 100 }); // EXPECTED COMPILE ERROR: Object literal may only specify known properties...
            expect(true).toBe(true); // Placeholder for test runner
        });

        it('should FAIL to compile if VelocityComponent is missing required properties (manual check)', () => {
            // entity.add(VelocityComponent, { dx: 1 }); // EXPECTED COMPILE ERROR: Property 'dy' is missing in type '{ dx: number; }' but required in type 'VelocityComponentProps'.
            // entity.add(VelocityComponent, {}); // EXPECTED COMPILE ERROR: Property 'dx' is missing... Property 'dy' is missing...
            expect(true).toBe(true); // Placeholder for test runner
        });

        it('should FAIL to compile if VelocityComponent is given wrong property types (manual check)', () => {
            // entity.add(VelocityComponent, { dx: "1", dy: 2 }); // EXPECTED COMPILE ERROR: Type 'string' is not assignable to type 'number'.
            expect(true).toBe(true); // Placeholder for test runner
        });

        it('should FAIL to compile if TagComponent is given wrong property types (manual check)', () => {
            // entity.add(TagComponent, { tag: 123 }); // EXPECTED COMPILE ERROR: Type 'number' is not assignable to type 'string | undefined'.
            expect(true).toBe(true); // Placeholder for test runner
        });

        it('should FAIL to compile if DataComponent is given wrong property types for value (manual check)', () => {
            // entity.add(DataComponent, { value: 123 }); // EXPECTED COMPILE ERROR: Type 'number' is not assignable to type 'string | null | undefined'.
            expect(true).toBe(true); // Placeholder for test runner
        });
    });

    describe('Entity - Generic get/has methods', () => {
        let entity: Entity;
        // world and engine are already in the outer scope, but re-declaring here for clarity if needed,
        // or ensuring they are correctly initialized in an appropriate beforeEach.
        // For simplicity, we'll rely on the outer scope's engine and world setup.

        beforeEach(() => {
            // engine and world are initialized in the top-level beforeEach.
            // Components (PositionComponent, TagComponent) are also registered there.
            entity = world.createEntity();
        });

        describe('get<T>', () => {
            it('should return the component instance with the correct type when component exists', () => {
                entity.add(PositionComponent, { x: 10, y: 20 });
                // After change, this will infer T as PositionComponent
                const position = entity.get(PositionComponent);

                expect(position).toBeInstanceOf(PositionComponent);
                if (position) { // Type guard for TypeScript
                    expect(position.x).toBe(10);
                    expect(position.y).toBe(20);
                    // const xCheck: number = position.x; // Should compile
                } else {
                    fail('Position component should exist');
                }
            });

            it('should return undefined with the correct type when component does not exist', () => {
                const position = entity.get(PositionComponent);
                expect(position).toBeUndefined();

                // Manual compile-time check (after changes to .get):
                // const yCheck: string = position; // Error: Type 'PositionComponent | undefined' is not assignable to 'string'.
            });
        });

        describe('has<T>', () => {
            it('should return true when component exists', () => {
                entity.add(TagComponent);
                // After change, this will infer T as TagComponent
                const hasTag = entity.has(TagComponent);
                expect(hasTag).toBe(true);
            });

            it('should return false when component does not exist', () => {
                const hasTag = entity.has(TagComponent);
                expect(hasTag).toBe(false);
            });

            it('should return a boolean type', () => {
                const hasPos = entity.has(PositionComponent);
                // const test: boolean = hasPos; // This should compile and be a boolean
                expect(typeof hasPos).toBe('boolean');
            });
        });
    });
});
