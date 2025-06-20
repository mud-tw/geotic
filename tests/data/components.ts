import { Component, ComponentProperties } from '../../../src'; // Adjusted path

export class EmptyComponent extends Component {}

// --- SimpleComponent ---
interface SimpleComponentProperties extends ComponentProperties {
    testProp: string;
}
export class SimpleComponent extends Component {
    static properties: SimpleComponentProperties = {
        testProp: 'thing',
    };
    testProp!: string; // Instance property
}

// --- NestedComponent ---
interface NestedComponentProperties extends ComponentProperties {
    name: string;
    hello: string;
    obprop: {
        key: string;
        arr: number[];
    };
}
export class NestedComponent extends Component {
    static allowMultiple: boolean = true;
    static keyProperty: string = 'name';
    static properties: NestedComponentProperties = {
        name: 'test',
        hello: 'world',
        obprop: {
            key: 'value',
            arr: [1, 2, 3],
        },
    };
    name!: string; // Instance properties
    hello!: string;
    obprop!: {
        key: string;
        arr: number[];
    };
}

// --- ArrayComponent ---
interface ArrayComponentProperties extends ComponentProperties {
    name: string;
    hello: string;
}
export class ArrayComponent extends Component {
    static allowMultiple: boolean = true;
    static properties: ArrayComponentProperties = {
        name: 'a',
        hello: 'world',
    };
    name!: string; // Instance properties
    hello!: string;
}
