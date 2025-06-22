import { Engine, World, Entity, ComponentClass, PrefabData, ComponentProperties } from '../../src'; // Adjusted path
import {
    EmptyComponent,
    SimpleComponent,
    ArrayComponent,
    NestedComponent,
} from '../data/components'; // Adjusted path
import {
    SimplePrefab,
    EmptyPrefab,
    PrefabWithKeyedAndArray,
} from '../data/prefabs'; // Adjusted path

// Use global chance instance if available
declare const chance: Chance.Chance;

describe('Prefab System (via World.createPrefab)', () => { // Renamed describe for clarity
    let engine: Engine;
    let world: World;

    beforeEach(() => {
        engine = new Engine();

        // Register components used in prefabs
        engine.registerComponent(EmptyComponent as ComponentClass);
        engine.registerComponent(SimpleComponent as ComponentClass);
        engine.registerComponent(ArrayComponent as ComponentClass);
        engine.registerComponent(NestedComponent as ComponentClass);

        world = engine.createWorld();
    });

    describe('prefab with no components', () => {
        let entity: Entity | undefined; // Entity can be undefined if createPrefab fails

        beforeEach(() => {
            engine.registerPrefab(EmptyPrefab as PrefabData); // Cast since it's imported JS object
            entity = world.createPrefab('EmptyPrefab');
        });

        it('should create an entity', () => {
            expect(entity).toBeDefined();
            expect(entity).toBeInstanceOf(Entity);
        });
    });

    describe('prefab with basic components', () => {
        let entity: Entity | undefined;

        beforeEach(() => {
            engine.registerPrefab(SimplePrefab as PrefabData);
        });

        describe('with no prop overrides', () => {
            beforeEach(() => {
                entity = world.createPrefab('SimplePrefab');
            });

            it('should create an entity', () => {
                expect(entity).toBeDefined();
                expect(entity).toBeInstanceOf(Entity);
            });

            it('should have the components', () => {
                expect(entity!.has(EmptyComponent)).toBe(true); // Use non-null assertion if sure
                expect(entity!.has(SimpleComponent)).toBe(true);
            });

            it('should assign component prop data from the prefab', () => {
                // Accessing dynamic properties requires casting or type assertion
                expect(((entity as any).simpleComponent as SimpleComponent).testProp).toBe('testPropValue');
            });
        });

        describe('with initial props', () => {
            // Define a more specific type for initialProps if possible,
            // using Partial<ComponentProperties> for individual component overrides.
            let initialProps: Record<string, Partial<ComponentProperties> | Partial<ComponentProperties>[]>;

            beforeEach(() => {
                initialProps = {
                    simpleComponent: { // Corresponds to SimpleComponent._ckey
                        testProp: chance.string(),
                    },
                };
                entity = world.createPrefab('SimplePrefab', initialProps);
            });

            it('should create an entity', () => {
                expect(entity).toBeDefined();
                expect(entity).toBeInstanceOf(Entity);
            });

            it('should have the components', () => {
                expect(entity!.has(EmptyComponent)).toBe(true);
                expect(entity!.has(SimpleComponent)).toBe(true);
            });

            it('should assign component prop data from the initial props', () => {
                expect(((entity as any).simpleComponent as SimpleComponent).testProp).toBe(
                    (initialProps.simpleComponent as {testProp: string}).testProp
                );
            });
        });
    });

    describe('prefab with array and keyed components', () => {
        let entity: Entity | undefined;

        beforeEach(() => {
            engine.registerPrefab(PrefabWithKeyedAndArray as PrefabData);
        });

        describe('with no prop overrides', () => {
            beforeEach(() => {
                entity = world.createPrefab('PrefabWithKeyedAndArray');
            });

            it('should create an entity', () => {
                expect(entity).toBeDefined();
                expect(entity).toBeInstanceOf(Entity);
            });

            it('should have the components', () => {
                expect(entity!.has(ArrayComponent)).toBe(true);
                expect(entity!.has(NestedComponent)).toBe(true);
                expect(((entity as any).arrayComponent as ArrayComponent[])).toHaveLength(2);
                expect(((entity as any).nestedComponent as Record<string, NestedComponent>)['one']).toBeDefined();
                expect(((entity as any).nestedComponent as Record<string, NestedComponent>)['two']).toBeDefined();
            });

            it('should assign component prop data from the prefab', () => {
                const ac = (entity as any).arrayComponent as ArrayComponent[];
                const nc = (entity as any).nestedComponent as Record<string, NestedComponent>;
                expect(ac[0].name).toBe('a');
                expect(ac[1].name).toBe('b');
                expect(nc['one'].name).toBe('one');
                expect(nc['two'].name).toBe('two');
            });
        });

        describe('with initial props', () => {
            let initialProps: Record<string, any>; // More specific type would be better

            beforeEach(() => {
                initialProps = {
                    // Key for NestedComponent is 'nestedComponent' (its ckey)
                    nestedComponent: {
                        one: { hello: chance.word() }, // 'one' is the keyProperty value
                        two: { hello: chance.word() }, // 'two' is the keyProperty value
                    },
                    // Key for ArrayComponent is 'arrayComponent' (its ckey)
                    arrayComponent: [ // Array of property objects
                        { name: chance.word() },
                        { name: chance.word() },
                    ],
                };

                entity = world.createPrefab(
                    'PrefabWithKeyedAndArray',
                    initialProps
                );
            });

            it('should create an entity', () => {
                expect(entity).toBeDefined();
                expect(entity).toBeInstanceOf(Entity);
            });

            it('should have the components', () => {
                expect(entity!.has(ArrayComponent)).toBe(true);
                expect(entity!.has(NestedComponent)).toBe(true);
                expect(((entity as any).arrayComponent as ArrayComponent[])).toHaveLength(2);
                expect(((entity as any).nestedComponent as Record<string, NestedComponent>)['one']).toBeDefined();
                expect(((entity as any).nestedComponent as Record<string, NestedComponent>)['two']).toBeDefined();
            });

            it('should assign component prop data from the initial props', () => {
                const ac = (entity as any).arrayComponent as ArrayComponent[];
                const nc = (entity as any).nestedComponent as Record<string, NestedComponent>;

                expect(ac[0].name).toBe(
                    initialProps.arrayComponent[0].name
                );
                expect(ac[1].name).toBe(
                    initialProps.arrayComponent[1].name
                );
                expect(nc['one'].hello).toBe( // Assuming 'hello' is a valid prop of NestedComponent
                    initialProps.nestedComponent.one.hello
                );
                expect(nc['two'].hello).toBe(
                    initialProps.nestedComponent.two.hello
                );
            });
        });
    });

    // TODO: Add tests for prefab inheritance:
    //   - Simple inheritance (one parent) and property/component overriding.
    //   - Multiple inheritance and order of application / conflict resolution if any.
    //   - Overriding components from parent with `overwrite: true/false` in child's PrefabComponent.
    describe('prefab with inheritance', () => {
        it.todo('should correctly apply components and properties from parent prefabs');
        it.todo('should allow child prefabs to override parent components and properties');
    });

    // TODO: Add tests for "flat" property overrides in `world.createPrefab(name, { flatProp: value })`
    //   Currently tests use structured overrides: `world.createPrefab(name, { componentKey: { prop: value } })`
    //   The Prefab.applyToEntity method has logic for both.
    describe('prefab with flat property overrides', () => {
        it.todo('should allow flat property overrides for single-instance components');
    });

    // TODO: Add tests for error handling and edge cases:
    //   - Instantiating a prefab that refers to an unregistered component type.
    //   - Instantiating a prefab with malformed data.
    describe('prefab error handling and edge cases', () => {
        it.todo('should handle instantiation of prefabs with missing component types');
    });
});
