import { camelString } from './util/string-util';
import type { Component } from './Component';

/**
 * Defines the type for a component class constructor.
 * This is used throughout the system to refer to component types.
 */
export type ComponentClass = new (...args: any[]) => Component;

/**
 * Interface for the internal map that stores registered component classes,
 * keyed by their camelCased name (ckey).
 */
interface ComponentMap {
    [key: string]: ComponentClass;
}

/**
 * The ComponentRegistry is responsible for managing all known component types within an Engine.
 * When a component class is registered, the registry assigns it a unique internal key (`_ckey`)
 * and a unique bitmask value (`_cbit`). These are attached to the component class's prototype
 * for easy access and are crucial for the ECS's internal operations, such as:
 * - Storing and retrieving components on entities using the `_ckey`.
 * - Efficiently matching entities against queries using `_cbit` bitmasks.
 *
 * Relationships:
 * - An instance of `ComponentRegistry` is typically owned by an `Engine`.
 * - It operates on `Component` class constructors.
 */
export class ComponentRegistry {
    /**
     * @private Counter used to generate unique bit values for each component type.
     * Starts at 0, so the first component gets bit 1 (2^0), second gets bit 2 (2^1), etc.
     * This is then converted to a BigInt for the actual `_cbit`.
     */
    private _cbit_counter: number = 0; // Renamed from _cbit to avoid confusion with prototype._cbit

    /**
     * @private Internal map storing registered component classes.
     * The key is the component's `_ckey` (e.g., "positionComponent"),
     * and the value is the component class constructor itself.
     */
    private _map: ComponentMap = {};

    /**
     * Registers a component class with the registry.
     * This process involves:
     * 1. Generating a camelCased key (`_ckey`) from the class name (e.g., `PositionComponent` -> `positionComponent`).
     * 2. Generating a unique bit value (`_cbit`) for the component type.
     * 3. Storing these `_ckey` and `_cbit` values on the `prototype` of the component class
     *    so that all instances can access them and they are available for system use.
     * 4. Storing the component class in an internal map for later retrieval by its `_ckey`.
     *
     * @param clazz The component class constructor to register (e.g., `Position`).
     * @example
     * const registry = new ComponentRegistry();
     * class MyComponent extends Component {}
     * registry.register(MyComponent);
     * // Now MyComponent.prototype._ckey is "myComponent"
     * // and MyComponent.prototype._cbit is a unique BigInt.
     */
    register(clazz: ComponentClass): void {
        const key = camelString(clazz.name); // e.g., "position" from "Position"

        // Assign the generated key and bitmask to the component class's prototype.
        // This makes `_ckey` and `_cbit` available on all instances of this component
        // and also directly on the class for system use (e.g., by Queries).
        (clazz.prototype as any)._ckey = key;
        // The bit value is 2 raised to the power of the current counter.
        // BigInt is used for _cbit to support a large number of component types.
        (clazz.prototype as any)._cbit = 1n << BigInt(this._cbit_counter++);


        this._map[key] = clazz; // Store the class constructor, keyed by its ckey.
    }

    /**
     * Retrieves a registered component class constructor by its key (`_ckey`).
     * This is used by the system (e.g., `Engine`, `World` during deserialization)
     * to get the actual class when only its name/key is known.
     *
     * @param key The `_ckey` (camelCased name) of the component class.
     * @returns The component class constructor if found, otherwise `undefined`.
     */
    get(key: string): ComponentClass | undefined {
        return this._map[key];
    }
}
