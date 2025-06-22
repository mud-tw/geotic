import { Engine, ComponentRegistry, ComponentClass } from '../../src'; // Adjusted path, ComponentClass for casting
import { EmptyComponent } from '../data/components'; // Adjusted path relative to tests/unit

describe('ComponentRegistry', () => {
    let registry: ComponentRegistry;

    beforeEach(() => {
        registry = new ComponentRegistry();
    });

    describe('get', () => {
        const expectedKey: string = 'emptyComponent'; // camelCase of EmptyComponent.name

        beforeEach(() => {
            // Cast to ComponentClass because EmptyComponent is a class,
            // and register expects a constructor that produces Component instances.
            registry.register(EmptyComponent as ComponentClass);
        });

        it('should assign a _ckey to the component prototype', () => {
            // Accessing prototype like this is okay in tests for verification
            expect((EmptyComponent.prototype as any)._ckey).toBe(expectedKey);
        });

        it('should assign a _cbit to the component prototype', () => {
            expect((EmptyComponent.prototype as any)._cbit).toBeGreaterThan(0n); // Or a specific bit if known
            // TODO: Test _cbit uniqueness and specific progression (1n, 2n, 4n, etc.) when registering multiple components.
            // Example:
            // class CompA extends Component {}
            // class CompB extends Component {}
            // registry.register(CompA as ComponentClass);
            // registry.register(CompB as ComponentClass);
            // expect((CompA.prototype as any)._cbit).toBe(1n << BigInt(X)); // Where X is its registration order
            // expect((CompB.prototype as any)._cbit).toBe(1n << BigInt(Y));
            // expect((CompA.prototype as any)._cbit).not.toBe((CompB.prototype as any)._cbit);
        });

        it('should return the component constructor by key', () => {
            expect(registry.get(expectedKey)).toBe(EmptyComponent);
        });

        it('should return undefined for an unregistered key', () => {
            expect(registry.get('unregisteredKey')).toBeUndefined();
        });

        // TODO: Test registering the same component class multiple times.
        // The _cbit should remain stable for a given component class after its first registration.
        // Currently, re-registering assigns a new _cbit, which is problematic.
        it.todo('should handle registration of the same component class multiple times gracefully (idempotent _cbit)');

        // TODO: Test _ckey generation with various component class names (e.g., all caps, numbers).
        it.todo('should generate correct _ckeys for various component names');
    });
});
