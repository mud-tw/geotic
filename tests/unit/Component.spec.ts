import { Engine, Component, Entity, World, ComponentProperties, ComponentClass } from '../../src'; // Adjusted path
import { EmptyComponent } from '../data/components';

describe('Component', () => {
    let engine: Engine;
    let world: World;
    let entity: Entity;
    let onDestroyedStub: jest.Mock;
    let onAttachedStub: jest.Mock;

    interface TestComponentProperties extends ComponentProperties {} // No specific props beyond base
    class TestComponent extends Component {
        // No static properties needed if it only has lifecycle methods
        onAttached(): void {
            onAttachedStub();
        }
        onDestroyed(): void {
            onDestroyedStub();
        }
    }

    interface NestedComponentProperties extends ComponentProperties {
        name: string;
        hello?: string; // Make optional if not always provided
        obprop?: { key: string; arr: number[] }; // Make optional
    }
    class NestedComponent extends Component {
        static properties: NestedComponentProperties = { // Typed static properties
            name: 'test',
        };
        static allowMultiple: boolean = true;
        static keyProperty: string = 'name';

        name!: string; // Instance properties
    }

    interface ArrayComponentProperties extends ComponentProperties {
        name: string;
        hello?: string; // Make optional
    }
    class ArrayComponent extends Component {
        static properties: ArrayComponentProperties = { // Typed static properties
            name: 'a',
        };
        static allowMultiple: boolean = true;

        name!: string; // Instance properties
    }

    beforeEach(() => {
        engine = new Engine();
        world = engine.createWorld();

        onAttachedStub = jest.fn();
        onDestroyedStub = jest.fn(); // Removed duplicate assignment

        engine.registerComponent(EmptyComponent); // Cast if necessary
        engine.registerComponent(TestComponent);
        engine.registerComponent(NestedComponent);
        engine.registerComponent(ArrayComponent);

        entity = world.createEntity();
    });

    describe('attach', () => {
        let component: TestComponent;

        beforeEach(() => {
            entity.add(TestComponent);
            component = (entity as any).testComponent as TestComponent; // Type assertion for dynamic property
        });

        it('should call the onAttached handler', () => {
            expect(onAttachedStub).toHaveBeenCalledTimes(1);
            expect(onAttachedStub).toHaveBeenCalledWith(); // No arguments expected for onAttached
        });

        it('should set the entity', () => {
            expect(component.entity).toBe(entity);
        });
    });

    describe('destroy', () => {
        let component: Component; // More generic type for component variable

        beforeEach(() => {
            entity.add(TestComponent);
            entity.add(NestedComponent, { name: 'a' });
            entity.add(NestedComponent, { name: 'b' });
            entity.add(ArrayComponent); // This will have name: 'a' by default
            entity.add(ArrayComponent, { name: 'b' }); // Add another with different name for distinctness
        });

        describe('when destroying a simple component', () => {
            beforeEach(() => {
                component = entity.testComponent;
                component.destroy();
            });

            it('should remove the component from the entity', () => {
                expect(entity.has(TestComponent)).toBe(false);
            });

            it('should call the "onDestroyed" handler', () => {
                expect(onDestroyedStub).toHaveBeenCalledTimes(1);
                expect(onDestroyedStub).toHaveBeenCalledWith(); // No arguments expected
            });

            // Removed duplicate test for "onDestroyed" handler

            it('should make the component "entity" property undefined after destruction', () => {
                // The entity property is deleted in Component.ts _onDestroyed
                expect(component.entity).toBeUndefined();
            });
        });

        describe('when destroying a keyed component', () => {
            beforeEach(() => {
                // Assuming nestedComponent.b is how it's accessed, need type assertion
                component = ((entity as any).nestedComponent as Record<string, NestedComponent>)['b'];
                component.destroy();
            });

            it('should remove the component from the entity', () => {
                expect((entity.nestedComponent as Record<string, NestedComponent>)['b']).toBeUndefined();
            });

            it('should not remove the other nested component from the entity', () => {
                expect(((entity as any).nestedComponent as Record<string, NestedComponent>)['a']).toBeDefined();
            });

            it('should make the component "entity" property undefined', () => {
                expect(component.entity).toBeUndefined();
            });
        });

        describe('when destroying an array component', () => {
            beforeEach(() => {
                // Accessing array components requires knowing their structure on the entity
                component = ((entity as any).arrayComponent as ArrayComponent[])[1];
                component.destroy();
            });

            it('should remove the component from the entity', () => {
                // After splice, the array is shorter or the element is undefined.
                // This depends on how Entity.remove handles array components.
                // Let's assume it splices, so the second element would be the one originally at index 2 if there were 3.
                // Or, if it nulls out:
                expect(((entity as any).arrayComponent as ArrayComponent[])[1]).toBeUndefined(); // Or check length
            });

            it('should not remove the other array component from the entity', () => {
                expect(((entity as any).arrayComponent as ArrayComponent[])[0]).toBeDefined();
            });

            it('should make the component "entity" property undefined', () => {
                expect(component.entity).toBeUndefined();
            });
        });
    });

    describe('constructor and property initialization', () => {
        // TODO: Test constructor with property overrides:
        //   - Ensure properties passed to `new Component(props)` override defaults from `static properties`.
        //   - Ensure properties *not* in `static properties` but passed in `props` are also set (current behavior).
        it.todo('should correctly initialize properties from constructor arguments');
    });

    describe('getters', () => {
        // TODO: Test `world` getter.
        // TODO: Test `allowMultiple` getter.
        // TODO: Test `keyProperty` getter.
        it.todo('should correctly return values for getters (world, allowMultiple, keyProperty)');
    });

    describe('event handling (_onEvent, onEvent, on[EventName])', () => {
        // TODO: Test event handling:
        //    - `onEvent` is called.
        //    - Specific `on[EventName]` (e.g., `onCustomEvent`) is called.
        //    - Event data is correctly passed to handlers.
        //    - Component methods like `evt.handle()` or `evt.prevent()` are callable (actual stop propagation is Entity responsibility).
        it.todo('should handle events dispatched to the component');
    });

    describe('serialize', () => {
        // TODO: Test `serialize()`:
        //    - Returns an object with only keys from `static properties`.
        //    - Values match current instance values.
        //    - Returns a deep clone.
        it.todo('should serialize the component based on static properties');
    });

    describe('properties deep cloning', () => { // Renamed from 'properties' to be more specific
        interface PropertyComponentProperties extends ComponentProperties {
            name: string;
            arr: (string | number | null | boolean)[];
            ob: {
                key: string;
                obarr: (string | number | null | boolean)[];
            };
        }
        class PropertyComponent extends Component {
            static properties: PropertyComponentProperties = {
                name: 'test',
                arr: ['value', 2, null, true],
                ob: {
                    key: 'test',
                    obarr: [6, null, false, 'value'],
                },
            };
            name!: string;
            arr!: (string | number | null | boolean)[];
            ob!: {
                key: string;
                obarr: (string | number | null | boolean)[];
            };
        }
        let entity1: Entity, entity2: Entity;

        beforeEach(() => {
            engine.registerComponent(PropertyComponent as ComponentClass);
            entity1 = world.createEntity();
            entity2 = world.createEntity();
        });

        it('should deep-clone properties on construction', () => {
            entity1.add(PropertyComponent);
            entity2.add(PropertyComponent);

            const comp1 = (entity1 as any).propertyComponent as PropertyComponent;
            const comp2 = (entity2 as any).propertyComponent as PropertyComponent;

            expect(comp1.arr).not.toBe(comp2.arr);
            expect(comp1.arr).toEqual(comp2.arr);

            expect(comp1.ob).not.toBe(comp2.ob);
            expect(comp1.ob).toEqual(comp2.ob);
        });
    });
});
