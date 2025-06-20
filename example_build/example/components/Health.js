import { Component } from '../../src';
class Health extends Component {
    // constructor(properties?: Partial<HealthProperties>) {
    //     super(properties);
    // }
    // Assuming 'onTest' is an event handler for an event named 'Test'
    // It should follow the convention onEventName(evt: EntityEvent)
    // If 'Test' is the event name, then the method should be onTest(evt: EntityEvent)
    // Or, if it's a dynamic handler name based on evt.handlerName, that's covered by Component base.
    // For explicit typing, let's assume it's for a specific event.
    onTest(evt) {
        // evt.handle() is available on EntityEvent
        evt.handle();
        console.log(`${this.entity ? this.entity.id : 'Entity'} handled Test event via Health component.`);
    }
}
Health.properties = {
    max: 10,
    current: 10,
};
export default Health;
