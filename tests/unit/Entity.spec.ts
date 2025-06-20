import { Engine, World, Entity, Component, ComponentProperties, ComponentClass } from '@src/index'; // Adjusted path
import { EmptyComponent } from '../data/components'; // Adjusted path

// Use global chance instance if available (from jest.setup.ts)
declare const chance: Chance.Chance; // Make TypeScript aware of global chance

describe('Entity', () => {
    let world: World;
    let engine: Engine; // Added engine variable

    // --- Test Component Definitions with Typing ---
    class TestComponent extends Component {}

    interface NestedComponentProperties extends ComponentProperties { name: string; }
    class NestedComponent extends Component {
        static properties: NestedComponentProperties = { name: 'test' };
        static allowMultiple: boolean = true;
        static keyProperty: string = 'name';
        name!: string;
    }

    interface ArrayComponentProperties extends ComponentProperties { name: string; }
    class ArrayComponent extends Component {
        static properties: ArrayComponentProperties = { name: 'a' };
        static allowMultiple: boolean = true;
        name!: string;
    }
    // --- End Test Component Definitions ---

    beforeEach(() => {
        engine = new Engine(); // Initialize engine

        engine.registerComponent(EmptyComponent as ComponentClass);
        engine.registerComponent(TestComponent as ComponentClass);
        engine.registerComponent(NestedComponent as ComponentClass);
        engine.registerComponent(ArrayComponent as ComponentClass);

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

            testComponentDestroySpy = jest.spyOn((entity as any).testComponent as TestComponent, '_onDestroyed');
            emptyComponentDestroySpy = jest.spyOn((entity as any).emptyComponent as EmptyComponent, '_onDestroyed');
            nestedComponentDestroySpy = jest.spyOn(((entity as any).nestedComponent as Record<string, NestedComponent>)['test'], '_onDestroyed');
            arrayComponentDestroySpy = jest.spyOn(((entity as any).arrayComponent as ArrayComponent[])[0], '_onDestroyed');

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
                expect((entity as any).testComponent).toBeDefined();
            });

            it('should include the component in the entity components map', () => {
                expect(entity.components['testComponent']).toBeInstanceOf(TestComponent);
            });

            it('should have the correct type of components', () => {
                expect((entity as any).testComponent).toBeInstanceOf(TestComponent);
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
                expect(((entity as any).nestedComponent as Record<string, NestedComponent>)[nameA]).toBeDefined();
                expect(((entity as any).nestedComponent as Record<string, NestedComponent>)[nameB]).toBeDefined();
            });

            it('should have the correct type of components', () => {
                expect(((entity as any).nestedComponent as Record<string, NestedComponent>)[nameA]).toBeInstanceOf(NestedComponent);
                expect(((entity as any).nestedComponent as Record<string, NestedComponent>)[nameB]).toBeInstanceOf(NestedComponent);
            });

            it('should set component properties', () => {
                expect(((entity as any).nestedComponent as Record<string, NestedComponent>)[nameA].name).toBe(nameA);
                expect(((entity as any).nestedComponent as Record<string, NestedComponent>)[nameB].name).toBe(nameB);
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
                const ac = (entity as any).arrayComponent as ArrayComponent[];
                expect(ac).toBeDefined();
                expect(ac).toHaveLength(2);
                expect(ac[0].name).toBe(nameA);
                expect(ac[1].name).toBe(nameB);
            });

            it('should assign the entity to each component', () => {
                const ac = (entity as any).arrayComponent as ArrayComponent[];
                expect(ac[0].entity).toBe(entity);
                expect(ac[1].entity).toBe(entity);
            });

            it('should include the components in the entity components map', () => {
                 expect(entity.components['arrayComponent']).toHaveLength(2);
            });

            it('should have the correct type of components', () => {
                const ac = (entity as any).arrayComponent as ArrayComponent[];
                expect(ac[0]).toBeInstanceOf(ArrayComponent);
                expect(ac[1]).toBeInstanceOf(ArrayComponent);
            });

            it('should set component properties', () => {
                const ac = (entity as any).arrayComponent as ArrayComponent[];
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
                comp = (entity as any).testComponent as TestComponent;
                entity.remove(comp);
            });

            it('should remove the component direct accessor', () => {
                expect((entity as any).testComponent).toBeUndefined();
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
                compA = ((entity as any).nestedComponent as Record<string, NestedComponent>)['a'];
                compB = ((entity as any).nestedComponent as Record<string, NestedComponent>)['b'];
            });

            describe('when one of them is removed', () => {
                beforeEach(() => {
                    entity.remove(compB);
                });

                it('should remove the specific keyed component direct accessor', () => {
                    expect(((entity as any).nestedComponent as Record<string, NestedComponent>)['b']).toBeUndefined();
                });
                it('should keep the other keyed component', () => {
                    expect(((entity as any).nestedComponent as Record<string, NestedComponent>)['a']).toBeDefined();
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
                    expect((entity as any).nestedComponent).toBeUndefined();
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
                compA = ((entity as any).arrayComponent as ArrayComponent[])[0];
                compB = ((entity as any).arrayComponent as ArrayComponent[])[1];
            });

            describe('when one of them is removed', () => {
                beforeEach(() => {
                    entity.remove(compB);
                });

                it('should remove the component from the array (implementation might make it undefined or shorten array)', () => {
                    // This depends on Entity.remove's behavior for array components (splice vs setting to undefined)
                    // Assuming it splices or sets to undefined. If it splices, length changes.
                    // If `entity.remove` sets the element to undefined in the array:
                    // expect(((entity as any).arrayComponent as ArrayComponent[])[1]).toBeUndefined();
                    // If `entity.remove` splices the array:
                    expect(((entity as any).arrayComponent as ArrayComponent[]).find(c => c === compB)).toBeUndefined();
                    expect(((entity as any).arrayComponent as ArrayComponent[]).length).toBe(1);

                });

                it('should keep the other component', () => {
                    expect(((entity as any).arrayComponent as ArrayComponent[])[0]).toBe(compA);
                });
            });

            describe('when all are removed', () => {
                beforeEach(() => {
                    entity.remove(compA);
                    entity.remove(compB);
                });

                it('should remove the parent direct accessor array', () => {
                    // The Entity logic might make `entity.arrayComponent` undefined if the array becomes empty.
                    expect((entity as any).arrayComponent).toBeUndefined();
                });
                 it('should remove from components map', () => {
                    expect(entity.components['arrayComponent']).toBeUndefined();
                });
            });
        });
    });
});
