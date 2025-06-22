import { Engine, World, Entity, Component, ComponentProperties, ComponentClass } from '@src/index'; // Adjusted path
// Adjusted path for components used in existing tests
import { EmptyComponent, NestedComponent as OldNestedComponent, ArrayComponent as OldArrayComponent } from '../data/components';
// Import new components for typing tests
import { PositionComponent, VelocityComponent, TagComponent, DataComponent, SimpleDataForTest } from '../data/components';


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
        engine.registerComponent(SimpleDataForTest); // Register the new component

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
            nestedComponentDestroySpy = jest.spyOn((entity.nestedComponent as Record<string, NestedComponent>)['test'], '_onDestroyed');
            arrayComponentDestroySpy = jest.spyOn((entity.arrayComponent as ArrayComponent[])[0], '_onDestroyed');

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
                expect((entity.nestedComponent as Record<string, NestedComponent>)[nameA]).toBeDefined();
                expect((entity.nestedComponent as Record<string, NestedComponent>)[nameB]).toBeDefined();
            });

            it('should have the correct type of components', () => {
                expect((entity.nestedComponent as Record<string, NestedComponent>)[nameA]).toBeInstanceOf(NestedComponent);
                expect((entity.nestedComponent as Record<string, NestedComponent>)[nameB]).toBeInstanceOf(NestedComponent);
            });

            it('should set component properties', () => {
                expect((entity.nestedComponent as Record<string, NestedComponent>)[nameA].name).toBe(nameA);
                expect((entity.nestedComponent as Record<string, NestedComponent>)[nameB].name).toBe(nameB);
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
                const ac = entity.arrayComponent as ArrayComponent[];
                expect(ac).toBeDefined();
                expect(ac).toHaveLength(2);
                expect(ac[0].name).toBe(nameA);
                expect(ac[1].name).toBe(nameB);
            });

            it('should assign the entity to each component', () => {
                const ac = entity.arrayComponent as ArrayComponent[];
                expect(ac[0].entity).toBe(entity);
                expect(ac[1].entity).toBe(entity);
            });

            it('should include the components in the entity components map', () => {
                 expect(entity.components['arrayComponent']).toHaveLength(2);
            });

            it('should have the correct type of components', () => {
                const ac = entity.arrayComponent as ArrayComponent[];
                expect(ac[0]).toBeInstanceOf(ArrayComponent);
                expect(ac[1]).toBeInstanceOf(ArrayComponent);
            });

            it('should set component properties', () => {
                const ac = entity.arrayComponent as ArrayComponent[];
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
                compA = (entity.arrayComponent as ArrayComponent[])[0];
                compB = (entity.arrayComponent as ArrayComponent[])[1];
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
                    expect((entity.arrayComponent as ArrayComponent[]).find(c => c === compB)).toBeUndefined();
                    expect((entity.arrayComponent as ArrayComponent[]).length).toBe(1);

                });

                it('should keep the other component', () => {
                    expect((entity.arrayComponent as ArrayComponent[])[0]).toBe(compA);
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

    // TODO: Test _cbits updates correctly on add/remove of components.
    // TODO: Test _candidacy() is called on add/remove.
    // TODO: Test add() behavior when adding a single-instance component that already exists (should replace).
    // TODO: Test remove() with a component instance not actually on the entity (should be graceful).

    describe('serialize', () => {
        // TODO: Test entity.serialize()
        //    - Correct ID
        //    - Serialization of single, array, and keyed components
        //    - Ensure only properties from static `properties` are serialized.
        it.todo('should serialize the entity and its components');
    });

    describe('clone', () => {
        // TODO: Test entity.clone() correctly calls world.cloneEntity(this)
        it.todo('should delegate cloning to the world');
    });

    describe('fireEvent', () => {
        // TODO: Test entity.fireEvent()
        //    - Dispatch to single, array, and keyed components
        //    - Event data reception
        //    - evt.handle() / evt.prevent() stopping propagation
        //    - on[EventName] handlers being called
        it.todo('should dispatch events to components and respect handling/prevention');
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
            // @ts-expect-error TS2345
            entity.add(PositionComponent, { x: "10" }); // EXPECTED COMPILE ERROR: Type 'string' is not assignable to type 'number | undefined'.
            // @ts-expect-error TS2345
            entity.add(PositionComponent, { x: 10, y: "20" }); // EXPECTED COMPILE ERROR: Type 'string' is not assignable to type 'number | undefined'.
            expect(true).toBe(true); // Placeholder for test runner
        });

        it('should FAIL to compile if PositionComponent is given non-existent properties (manual check)', () => {
            // @ts-expect-error TS2345 (or TS2322 if props are exact)
            entity.add(PositionComponent, { z: 30 }); // EXPECTED COMPILE ERROR: Object literal may only specify known properties, and 'z' does not exist in type 'Partial<PositionComponentProps>'.
            // @ts-expect-error TS2345
            entity.add(PositionComponent, { x: 10, nonExistent: 100 }); // EXPECTED COMPILE ERROR: Object literal may only specify known properties...
            expect(true).toBe(true); // Placeholder for test runner
        });

        it('should FAIL to compile if VelocityComponent is missing required properties (manual check)', () => {
            // @ts-expect-error TS2741
            entity.add(VelocityComponent, { dx: 1 }); // EXPECTED COMPILE ERROR: Property 'dy' is missing in type '{ dx: number; }' but required in type 'VelocityComponentProps'.
            // @ts-expect-error TS2739
            entity.add(VelocityComponent, {}); // EXPECTED COMPILE ERROR: Property 'dx' is missing... Property 'dy' is missing...
            expect(true).toBe(true); // Placeholder for test runner
        });

        it('should FAIL to compile if VelocityComponent is given wrong property types (manual check)', () => {
            // @ts-expect-error TS2345
            entity.add(VelocityComponent, { dx: "1", dy: 2 }); // EXPECTED COMPILE ERROR: Type 'string' is not assignable to type 'number'.
            expect(true).toBe(true); // Placeholder for test runner
        });

        it('should FAIL to compile if TagComponent is given wrong property types (manual check)', () => {
            // @ts-expect-error TS2345
            entity.add(TagComponent, { tag: 123 }); // EXPECTED COMPILE ERROR: Type 'number' is not assignable to type 'string | undefined'.
            expect(true).toBe(true); // Placeholder for test runner
        });

        it('should FAIL to compile if DataComponent is given wrong property types for value (manual check)', () => {
            // @ts-expect-error TS2345
            entity.add(DataComponent, { value: 123 }); // EXPECTED COMPILE ERROR: Type 'number' is not assignable to type 'string | null | undefined'.
            expect(true).toBe(true); // Placeholder for test runner
        });

        describe('for components using base constructor (properties inferred from static properties)', () => {
            it('should allow adding SimpleDataForTest with correct optional properties', () => {
                entity.add(SimpleDataForTest, { value: 100, name: "test" });
                const sdt1 = entity.simpleDataForTest as SimpleDataForTest;
                expect(sdt1.value).toBe(100);
                expect(sdt1.name).toBe("test");
                expect(sdt1.isActive).toBe(true); // default

                world.destroyEntity(entity.id); entity = world.createEntity();
                entity.add(SimpleDataForTest, { isActive: false });
                const sdt2 = entity.simpleDataForTest as SimpleDataForTest;
                expect(sdt2.value).toBe(0); // default
                expect(sdt2.name).toBe("default"); // default
                expect(sdt2.isActive).toBe(false);

                world.destroyEntity(entity.id); entity = world.createEntity();
                entity.add(SimpleDataForTest, {});
                const sdt3 = entity.simpleDataForTest as SimpleDataForTest;
                expect(sdt3.value).toBe(0);
                expect(sdt3.name).toBe("default");
                expect(sdt3.isActive).toBe(true);


                world.destroyEntity(entity.id); entity = world.createEntity();
                entity.add(SimpleDataForTest); // No properties
                const sdt4 = entity.simpleDataForTest as SimpleDataForTest;
                expect(sdt4.value).toBe(0);
                expect(sdt4.name).toBe("default");
                expect(sdt4.isActive).toBe(true);
            });

            it('should FAIL to compile if SimpleDataForTest is given wrong property types (manual check)', () => {
                // @ts-expect-error TS2345
                entity.add(SimpleDataForTest, { value: "100" }); // EXPECTED COMPILE ERROR: Type 'string' not 'number'.
                // @ts-expect-error TS2345
                entity.add(SimpleDataForTest, { name: 123 });    // EXPECTED COMPILE ERROR: Type 'number' not 'string'.
                // @ts-expect-error TS2345
                entity.add(SimpleDataForTest, { isActive: "true" });// EXPECTED COMPILE ERROR: Type 'string' not 'boolean'.
                expect(true).toBe(true); // Placeholder
            });

            it('should FAIL to compile if SimpleDataForTest is given non-existent properties (manual check)', () => {
                // @ts-expect-error TS2345
                entity.add(SimpleDataForTest, { unknownProp: "test" }); // EXPECTED COMPILE ERROR: 'unknownProp' does not exist.
                expect(true).toBe(true); // Placeholder
            });
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
