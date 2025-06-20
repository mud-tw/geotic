import { Engine, ComponentRegistry, ComponentClass } from '@src/index'; // Adjusted path, ComponentClass for casting
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
        });

        it('should return the component constructor by key', () => {
            expect(registry.get(expectedKey)).toBe(EmptyComponent);
        });

        it('should return undefined for an unregistered key', () => {
            expect(registry.get('unregisteredKey')).toBeUndefined();
        });
    });
});
