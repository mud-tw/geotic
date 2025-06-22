import { camelString } from './util/string-util';
import type { Entity } from './Entity';

/**
 * Represents an event that is fired on an Entity and dispatched to its Components.
 * Components can listen for specific events and react to them, potentially altering their state
 * or the state of their parent entity. Events can also carry data and be stopped from
 * propagating further.
 *
 * Key Properties:
 * - `name`: The string identifier for the event (e.g., "take-damage", "item-equipped").
 * - `data`: An arbitrary payload object associated with the event.
 * - `handlerName`: A pre-calculated camelCased method name (e.g., "onTakeDamage") that
 *                  components can implement to specifically handle this event type.
 * - `prevented`: A flag indicating if event propagation should stop.
 * - `handled`: A flag often used synonymously with `prevented`; `handle()` sets both.
 * - `entity`: An optional reference to the entity that fired the event.
 *
 * Usage:
 * - Typically created by `Entity.fireEvent()`.
 * - Passed to `Component._onEvent()`, which then may call `Component.onEvent()` and/or
 *   `Component.on[EventName]()`.
 */
export class EntityEvent {
    /** The name of the event (e.g., "take-damage"). */
    name: string;
    /** Arbitrary data payload associated with the event. */
    data: { [key: string]: any };
    /**
     * If true, the event will not be propagated to any further components on the entity
     * after the current component finishes processing it.
     */
    prevented: boolean = false;
    /**
     * If true, indicates the event has been "handled". Conventionally, this also means
     * it should be prevented from further propagation. The `handle()` method sets both.
     */
    handled: boolean = false;
    /**
     * The expected name of a handler method on a component for this event
     * (e.g., "onTakeDamage" for an event named "take-damage").
     * Calculated by camelCasing "on " + event name.
     */
    handlerName: string;
    /** Optional: The entity instance on which this event was fired. */
    entity?: Entity;

    /**
     * Creates a new EntityEvent instance.
     * @param name The name of the event.
     * @param data Optional data payload for the event.
     */
    constructor(name: string, data: { [key: string]: any } = {}) {
        this.name = name;
        this.data = data;
        // Pre-calculate the conventional handler method name.
        // e.g., if name is "item-pickup", handlerName becomes "onItemPickup".
        this.handlerName = camelString(`on ${this.name}`);
    }

    /**
     * Checks if this event's name matches the provided name.
     * @param name The event name to compare against.
     * @returns `true` if the names match, `false` otherwise.
     */
    is(name: string): boolean {
        return this.name === name;
    }

    /**
     * Marks this event as handled and prevents its further propagation.
     * Sets both `handled` and `prevented` flags to `true`.
     */
    handle(): void {
        this.handled = true;
        this.prevented = true;
    }

    /**
     * Prevents this event from propagating to any further components.
     * Sets the `prevented` flag to `true`.
     * Note: `handle()` is often preferred as it also marks the event as handled.
     */
    prevent(): void {
        this.prevented = true;
    }
}
