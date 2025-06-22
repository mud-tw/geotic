import { Component, ComponentProperties } from '@src/index'; // Adjusted path

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

// --- Components for Entity.add typing tests ---

export interface PositionComponentProps {
    x?: number;
    y?: number;
}
export class PositionComponent extends Component {
    static properties = {
        x: 0,
        y: 0,
    };
    x: number;
    y: number;

    constructor(props?: PositionComponentProps) {
        super(props);
        this.x = props?.x ?? (this.constructor as typeof PositionComponent).properties.x;
        this.y = props?.y ?? (this.constructor as typeof PositionComponent).properties.y;
    }
}

export interface VelocityComponentProps {
    dx: number;
    dy: number;
}
export class VelocityComponent extends Component {
    static properties = {
        dx: 0,
        dy: 0,
    };
    dx: number;
    dy: number;

    constructor(props: VelocityComponentProps) { // Note: props is not optional
        super(props);
        this.dx = props.dx;
        this.dy = props.dy;
    }
}

export class TagComponent extends Component {
    // No specific constructor, relies on base
    static properties = {
        tag: "default"
    };
    tag: string = "default";

    // If we want to test adding it without properties, its constructor should allow it.
    // The base Component constructor already allows `properties` to be undefined.
    constructor(props?: { tag?: string }) { // Make constructor accept optional tag
        super(props);
        if (props && props.tag !== undefined) {
            this.tag = props.tag;
        } else {
            this.tag = (this.constructor as typeof TagComponent).properties.tag;
        }
    }
}

export interface DataComponentProps {
    value?: string | null;
}
export class DataComponent extends Component {
    static properties = {
        value: null,
    };
    value: string | null;

    constructor(props?: DataComponentProps) {
        super(props);
        // Ensure 'value' key existence for Object.assign behavior if props is undefined
        const defaultProps = (this.constructor as typeof DataComponent).properties;
        this.value = props?.value === undefined ? defaultProps.value : props.value;
    }
}

// Component for testing T1.1 (Entity.add strong typing)
// Relies on base Component constructor, so its properties for `add` should
// be inferred from `static properties`.
export class SimpleDataForTest extends Component {
    static properties = {
        value: 0,
        name: "default",
        isActive: true
    };
    value!: number;
    name!: string;
    isActive!: boolean;
    // No explicit constructor
}
