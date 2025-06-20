import { Engine, Component, World, Entity, EntityEvent, ComponentClass } from '@src/index'; // Adjusted path
import { EmptyComponent } from '../data/components'; // Adjusted path

// Use global chance instance if available
declare const chance: Chance.Chance;

describe('Entity Events Integration Test', () => { // Renamed for clarity
    let world: World;
    let engine: Engine; // Added engine
    let onTestEventStub: jest.Mock;

    // Test component that handles a specific event
    class EventComponent extends Component {
        // Method name matches 'on' + capitalized event name from fireEvent
        // e.g. fireEvent('test-event') -> onTestEvent(evt)
        // The EntityEvent class has a handlerName property like 'onTestEvent'
        // which the Component base class can use to call this.
        onTestEvent(evt: EntityEvent): void { // Typed the event parameter
            onTestEventStub(evt);
        }
    }

    beforeEach(() => {
        engine = new Engine(); // Initialize engine
        world = engine.createWorld();

        onTestEventStub = jest.fn();
        engine.registerComponent(EventComponent as ComponentClass);
        engine.registerComponent(EmptyComponent as ComponentClass); // Though EmptyComponent isn't used in this test directly
    });

    describe('fireEvent', () => { // Changed describe to be more specific
        let entity: Entity;
        let eventData: Record<string, any>; // Typed event data

        beforeEach(() => {
            entity = world.createEntity();
            entity.add(EventComponent);
            eventData = { message: chance.sentence(), count: chance.natural() }; // Ensure chance.object returns a suitable type

            // fireEvent will create an EntityEvent internally
            entity.fireEvent('test-event', eventData);
        });

        it('should call the event handler method on the component (e.g., onTestEvent)', () => {
            expect(onTestEventStub).toHaveBeenCalledTimes(1);

            // Check the argument passed to the stub, which should be an EntityEvent instance
            const receivedEvent: EntityEvent = onTestEventStub.mock.calls[0][0];

            expect(receivedEvent).toBeInstanceOf(EntityEvent);
            expect(receivedEvent.name).toBe('test-event');
            expect(receivedEvent.data).toBe(eventData);
            expect(receivedEvent.entity).toBe(entity); // EntityEvent should also have a reference to the entity
        });
    });
});
