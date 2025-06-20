import { Component, ComponentProperties } from '../../src';

interface MaterialProperties extends ComponentProperties {
    name: string;
}

export default class Material extends Component {
    static properties: MaterialProperties = {
        name: 'air',
    };

    // Instance properties
    name!: string;

    // constructor(properties?: Partial<MaterialProperties>) {
    //     super(properties);
    // }

    onAttached(): void {
        console.log(`${this.name} onAttached`, this.entity.id);
    }

    // Renaming onDetached to onDestroyed
    onDestroyed(): void {
        console.log(`${this.name} onDestroyed`, this.entity.id);
    }
}
