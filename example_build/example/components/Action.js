import { Component } from '../../src'; // Assuming ComponentProperties is exported
class Action extends Component {
    // Optional: If you need to initialize or use these in the constructor or other methods
    // constructor(properties?: Partial<ActionProperties>) {
    //     super(properties);
    //     // Note: 'name' and 'data' are automatically assigned by the Component constructor
    //     // from the static properties and the passed properties.
    // }
    onAttached() {
        console.log(`action ${this.name} attached`);
    }
    // onDetached is not a standard Component lifecycle method, maybe it was intended as onDestroyed?
    // Assuming it's a custom method or a typo for onDestroyed.
    // If it's custom, its usage would need to be reviewed.
    // If it should be onDestroyed:
    onDestroyed() {
        console.log(`action ${this.name} detached (now onDestroyed)`);
    }
}
Action.properties = {
    name: '',
    data: {},
};
Action.allowMultiple = true;
export default Action;
