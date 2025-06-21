import { Engine, World, Component, ComponentClass, PrefabData } from '@src/index'; // Adjusted path

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
});
