import { Entity, Engine, World, Component, ComponentClass, PrefabData } from '@src/index'; // Adjusted path

describe('Engine', () => {
    let engine: Engine;

    beforeEach(() => {
        engine = new Engine();
    });

    describe('createWorld', () => {
        let result: World;

        beforeEach(() => {
            result = engine.createWorld();
        });

        it('should create a World instance', () => {
            expect(result).toBeInstanceOf(World);
        });

        it('should assign the engine to the world', () => {
            expect(result.engine).toBe(engine);
        });
    });

    // Basic tests for component and prefab registration to ensure plumbing
    // More detailed tests for these registries themselves are in their own spec files.
    describe('component registration', () => {
        class TestComponent extends Component {} // Use Engine.Component as base
        beforeEach(() => {
            engine.registerComponent(TestComponent as ComponentClass);
        });

        it('should allow component registration', () => {
            // Check if the component is retrievable via internal registry (conceptual test)
            // This might require exposing a way to get a component from the engine or its registry for testing
            const registry = engine._components; // Accessing private member for test
            expect(registry.get('testComponent')).toBe(TestComponent);
        });
    });

    describe('prefab registration', () => {
        const testPrefab: PrefabData = { name: 'TestPrefab', components: [] };
        beforeEach(() => {
            engine.registerPrefab(testPrefab);
        });

        it('should allow prefab registration', () => {
            // Check if prefab is retrievable (conceptual test)
            const registry = engine._prefabs; // Accessing private member for test
            expect(registry.get('TestPrefab')).toBeDefined();
        });
    });

    describe('destroyWorld', () => {
        let worldInstance: World;
        let destroySpy: jest.SpyInstance;

        beforeEach(() => {
            worldInstance = engine.createWorld();
            destroySpy = jest.spyOn(worldInstance, 'destroy');
            engine.destroyWorld(worldInstance);
        });

        it('should call destroy on the world instance', () => {
            expect(destroySpy).toHaveBeenCalledTimes(1);
        });
    });

    describe('getComponentClass', () => {
        class MyComponentForTest extends Component {}

        it('should return the component class if registered', () => {
            engine.registerComponent(MyComponentForTest);
            const CompClass = engine.getComponentClass('myComponentForTest'); // Assuming method exists
            expect(CompClass).toBe(MyComponentForTest);
        });

        it('should return undefined if the component class is not registered', () => {
            const CompClass = engine.getComponentClass('nonExistentComponent');
            expect(CompClass).toBeUndefined();
        });
    });

    describe('createPrefabInstance', () => {
        // Assuming PositionComponent is available and registered for these tests
        // Let's define a simple PositionComponent for testing if not already imported
        class PosComponent extends Component {
            static properties = { x: 0, y: 0 };
            x: number = 0;
            y: number = 0;
            constructor(props?: { x?: number, y?: number }) {
                super(props);
                this.x = props?.x ?? (this.constructor as typeof PosComponent).properties.x;
                this.y = props?.y ?? (this.constructor as typeof PosComponent).properties.y;
            }
        }
        const testPrefab: PrefabData = {
            name: 'TestPrefabWithPos',
            components: [{ type: 'PosComponent', properties: { x: 1, y: 2 } }],
        };
        let world: World;

        beforeEach(() => {
            engine.registerComponent(PosComponent);
            engine.registerPrefab(testPrefab);
            world = engine.createWorld();
        });

        it('should return an entity for a valid prefab name', () => {
            const entity = engine.createPrefabInstance(world, 'TestPrefabWithPos');
            expect(entity).toBeInstanceOf(Entity);
        });

        it('should return an entity with components from the prefab', () => {
            const entity = engine.createPrefabInstance(world, 'TestPrefabWithPos')!; // Assert not undefined
            expect(entity.has(PosComponent)).toBe(true);
            const pos = entity.get(PosComponent);
            expect(pos).toBeDefined();
            expect(pos?.x).toBe(1);
            expect(pos?.y).toBe(2);
        });

        it('should override prefab properties with given properties', () => {
            const entity = engine.createPrefabInstance(world, 'TestPrefabWithPos', { x: 100 })!;
            const pos = entity.get(PosComponent);
            expect(pos?.x).toBe(100);
            expect(pos?.y).toBe(2); // y should remain from prefab default
        });

        // TODO: Add test case for structured property overrides, e.g., engine.createPrefabInstance(world, 'TestPrefabWithPos', { PosComponent: { x: 200 } });
        // This depends on how Prefab.applyToEntity prioritizes flat vs structured overrides from the top-level call.

        it('should handle prefab component properties correctly even if not overridden, and ignore irrelevant overrides', () => {
            const entity = engine.createPrefabInstance(world, 'TestPrefabWithPos', { z: 300 })!; // z is not in PosComponent
            const pos = entity.get(PosComponent);
            expect(pos?.x).toBe(1); // Should take from prefab
            expect(pos?.y).toBe(2); // Should take from prefab
        });


        it('should return undefined for an unknown prefab name', () => {
            // let entity: Entity | undefined;
            // try {
            const entity = engine.createPrefabInstance(world, 'UnknownPrefab');
            // } catch (error) {}
            // const entity = engine.createPrefabInstance(world, 'UnknownPrefab');
            expect(entity).toBeUndefined();
        });
    });
});
