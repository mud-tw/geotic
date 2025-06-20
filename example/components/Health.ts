import { Component, ComponentProperties, EntityEvent } from '../../src';

interface HealthProperties extends ComponentProperties {
    max: number;
    current: number;
}

export default class Health extends Component {
    static properties: HealthProperties = {
        max: 10,
        current: 10,
    };

    // Instance properties
    max!: number;
    current!: number;

    // constructor(properties?: Partial<HealthProperties>) {
    //     super(properties);
    // }

    // Assuming 'onTest' is an event handler for an event named 'Test'
    // It should follow the convention onEventName(evt: EntityEvent)
    // If 'Test' is the event name, then the method should be onTest(evt: EntityEvent)
    // Or, if it's a dynamic handler name based on evt.handlerName, that's covered by Component base.
    // For explicit typing, let's assume it's for a specific event.
    onTest(evt: EntityEvent): void { // Added EntityEvent type
        // evt.handle() is available on EntityEvent
        evt.handle();
        console.log(`${this.entity ? this.entity.id : 'Entity'} handled Test event via Health component.`);
    }
}
