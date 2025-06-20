import { Component, ComponentProperties } from '../../src'; // Assuming ComponentProperties is exported

interface ActionProperties extends ComponentProperties {
    name: string;
    data: Record<string, any>; // Or a more specific type if data structure is known
}

export default class Action extends Component {
    static properties: ActionProperties = {
        name: '',
        data: {},
    };

    static allowMultiple: boolean = true;

    // Instance properties to match static properties for typed access
    name!: string;
    data!: Record<string, any>;

    // Optional: If you need to initialize or use these in the constructor or other methods
    // constructor(properties?: Partial<ActionProperties>) {
    //     super(properties);
    //     // Note: 'name' and 'data' are automatically assigned by the Component constructor
    //     // from the static properties and the passed properties.
    // }

    onAttached(): void {
        console.log(`action ${this.name} attached`);
    }

    // onDetached is not a standard Component lifecycle method, maybe it was intended as onDestroyed?
    // Assuming it's a custom method or a typo for onDestroyed.
    // If it's custom, its usage would need to be reviewed.
    // If it should be onDestroyed:
    onDestroyed(): void {
        console.log(`action ${this.name} detached (now onDestroyed)`);
    }
}
