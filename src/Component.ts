import { deepClone } from './util/deep-clone';
import type { Entity } from './Entity';
import type { World } from './World';
import type { EntityEvent } from './EntityEvent';

/**
 * Defines the structure for component properties, which is a general key-value map.
 * These are the properties that are typically defined in `static properties` of a Component subclass
 * and are subject to serialization.
 */
export interface ComponentProperties {
    [key: string]: any;
}

/**
 * The base class for all components in the ECS.
 * Components are primarily data containers that define the characteristics and state of entities.
 * They can also include methods for behavior related to their data and respond to entity events.
 *
 * Static Properties (defined on subclasses):
 * - `properties`: An object defining the default schema and initial values for the component's data.
 *                 Only these properties are typically serialized.
 * - `allowMultiple`: (Default: `false`) A boolean indicating if multiple instances of this component
 *                    type can be attached to a single entity.
 * - `keyProperty`: (Default: `null`) If `allowMultiple` is true, this string specifies which property
 *                  of the component instance should be used as a key when storing it on the entity
 *                  (e.g., `entity.equipmentSlot.head` where `keyProperty` is 'name').
 *
 * Instance Properties (some managed by the system):
 * - `_ckey`: (Injected) The camel-cased name of the component class, used as its unique key (e.g., "position").
 * - `_cbit`: (Injected) A unique bitmask value for this component type, used for efficient query matching.
 * - `entity`: A reference to the `Entity` this component instance is currently attached to.
 * - `world`: A getter that returns the `World` the `entity` belongs to.
 *
 * Lifecycle Methods (intended to be overridden by subclasses):
 * - `onAttached(entity: Entity)`: Called after the component is successfully added to an entity.
 * - `onDestroyed()`: Called just before the component is removed from an entity or when the entity is destroyed.
 * - `onEvent(evt: EntityEvent)`: A generic event handler called for any event fired on the entity.
 * - `on[EventName](evt: EntityEvent)`: Specific event handlers (e.g., `onTakeDamage(evt)`) that are
 *                                   automatically invoked if an event with a matching name is fired on the entity.
 */
export class Component {
    /**
     * Static property: Determines if multiple instances of this component can be added to a single entity.
     * Defaults to `false`. If `true`, instances are stored as an array on the entity, or as an object
     * if `keyProperty` is also defined.
     */
    static allowMultiple: boolean = false;

    /**
     * Static property: If `allowMultiple` is true, this specifies a property name on the component instance
     * whose value will be used as a key to access the component on the entity.
     * E.g., if `keyProperty` is 'slotName', and a component has `slotName: 'head'`, it might be accessed
     * via `entity.myComponentType.head`. If `null` and `allowMultiple` is true, components are stored in an array.
     * Defaults to `null`.
     */
    static keyProperty: string | null = null;

    /**
     * Static property: Defines the default properties and their initial values for this component type.
     * These are the properties that will be serialized and deserialized.
     * Subclasses should override this with their specific data schema.
     * @example
     * class Position extends Component {
     *   static properties = { x: 0, y: 0, z: 0 };
     *   x!: number; y!: number; z!: number; // Corresponding instance properties
     * }
     */
    static properties: ComponentProperties = {};

    /**
     * @internal System-injected camelCase key for this component type (e.g., "healthComponent").
     * Used for storing and retrieving the component on an entity.
     */
    _ckey!: string;
    /**
     * @internal System-injected unique bit value for this component type.
     * Used in bitmask calculations for efficient query matching.
     */
    _cbit!: bigint;

    /** The Entity instance this component is currently attached to. Set by the system via `_onAttached`. */
    entity!: Entity;

    /** Gets the World instance that the parent entity belongs to. */
    get world(): World {
        return this.entity.world;
    }

    /** Convenience getter to access the static `allowMultiple` property from an instance. */
    get allowMultiple(): boolean {
        return (this.constructor as typeof Component).allowMultiple;
    }

    /** Convenience getter to access the static `keyProperty` from an instance. */
    get keyProperty(): string | null {
        return (this.constructor as typeof Component).keyProperty;
    }

    /**
     * Constructs a new Component instance.
     * Initializes the component's properties by merging the static default `properties`
     * with any `properties` passed to the constructor.
     * @param properties Optional. An object with initial values for the component's properties,
     *                   overriding the defaults defined in `static properties`.
     */
    constructor(properties: Partial<ComponentProperties> = {}) {
        // Deep clone the static default properties to avoid shared state issues.
        const intrinsics = deepClone((this.constructor as typeof Component).properties);
        // Assign defaults, then override with provided properties.
        Object.assign(this, intrinsics, properties);
    }

    /**
     * Removes this component instance from its parent entity.
     * This effectively calls `this.entity.remove(this)`.
     */
    destroy(): void {
        // `this as any` is used due to the complexity of typing components with injected properties
        // when passing `this` to `entity.remove`.
        this.entity.remove(this as any);
    }

    /**
     * @internal Internal lifecycle method called by the Entity when this component is being destroyed.
     * It calls the user-overridable `onDestroyed` method and then cleans up its reference to the entity.
     * Subclasses should not call this directly; override `onDestroyed` instead.
     */
    _onDestroyed(): void {
        this.onDestroyed(); // Call user-overridable lifecycle hook
        // @ts-ignore: Clean up reference to entity after destruction to prevent memory leaks/stale refs.
        delete this.entity;
    }

    /**
     * @internal Internal method called by the Entity to dispatch an event to this component.
     * It first calls the generic `onEvent` handler, then checks for a specific `on[EventName]` handler
     * (e.g., `onTakeDamage`) based on `evt.handlerName` and calls it if it exists.
     * Subclasses should not call this directly; implement `onEvent` and/or specific `on[EventName]` handlers.
     * @param evt The `EntityEvent` being dispatched.
     */
    _onEvent(evt: EntityEvent): void {
        this.onEvent(evt); // Call generic event handler

        // If a specific handler (e.g., onMyEventName) exists for the event, call it.
        // evt.handlerName is pre-calculated (e.g., "onTakeDamage" for a "take-damage" event).
        if (typeof (this as any)[evt.handlerName] === 'function') {
            (this as any)[evt.handlerName](evt);
        }
    }

    /**
     * @internal Internal lifecycle method called by the Entity when this component is attached.
     * It sets the `this.entity` reference and then calls the user-overridable `onAttached` method.
     * Subclasses should not call this directly; override `onAttached` instead.
     * @param entity The entity this component is being attached to.
     */
    _onAttached(entity: Entity): void {
        this.entity = entity; // Establish the link to the parent entity
        this.onAttached(entity); // Call user-overridable lifecycle hook
    }

    /**
     * Serializes the component's data into a plain JavaScript object.
     * Only properties defined in the component's `static properties` schema are included.
     * @returns A plain object containing the serializable properties and their current values.
     */
    serialize(): ComponentProperties {
        const ob: ComponentProperties = {};
        // Iterate over the keys defined in the static 'properties' schema.
        for (const key in (this.constructor as typeof Component).properties) {
            ob[key] = (this as any)[key]; // Copy the current value of the property.
        }
        // Return a deep clone to prevent external modification of internal state if properties are objects/arrays.
        return deepClone(ob);
    }

    /**
     * Lifecycle method: Called after the component is successfully added to an entity.
     * Subclasses can override this to perform initialization logic that depends on the entity
     * (e.g., caching references, setting up subscriptions related to the entity).
     * @param entity The entity this component has been attached to.
     */
    onAttached(entity: Entity): void {} // eslint-disable-line @typescript-eslint/no-unused-vars

    /**
     * Lifecycle method: Called just before the component is removed from an entity
     * or when the entity itself is destroyed.
     * Subclasses can override this to perform cleanup logic (e.g., releasing resources,
     * unsubscribing from events).
     */
    onDestroyed(): void {}

    /**
     * Event handler: Called for any event fired on the entity to which this component is attached.
     * Subclasses can override this to implement generic event handling logic.
     * Specific event handlers like `onMyEventName(evt)` will be called after this method,
     * if they exist and the event is not handled/prevented.
     * @param evt The `EntityEvent` object containing event details.
     */
    onEvent(evt: EntityEvent): void {} // eslint-disable-line @typescript-eslint/no-unused-vars
}
