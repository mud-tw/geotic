import { Component, ComponentProperties } from '../../src';

interface ListenerProperties extends ComponentProperties {
    range: number;
}

export default class Listener extends Component {
    static properties: ListenerProperties = {
        range: 6,
    };

    // Instance properties
    range!: number;

    // constructor(properties?: Partial<ListenerProperties>) {
    //     super(properties);
    // }

    // This component doesn't have any methods shown in the JS version.
    // If it needs to react to events, methods like onSomeEvent(evt: EntityEvent) would be added.
}
