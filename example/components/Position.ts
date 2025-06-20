import { Component, ComponentProperties } from '../../src';

interface PositionProperties extends ComponentProperties {
    x: number;
    y: number;
}

export default class Position extends Component {
    static properties: PositionProperties = {
        x: 0,
        y: 0,
    };

    // Instance properties
    x!: number;
    y!: number;

    // constructor(properties?: Partial<PositionProperties>) {
    //     super(properties);
    // }

    // No methods in the original JS version.
}
