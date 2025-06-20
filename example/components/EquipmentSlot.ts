import { Component, ComponentProperties, Entity } from '../../dist/geotic.es.js'; // Assuming Entity is also exported

interface EquipmentSlotProperties extends ComponentProperties {
    name: string;
    allowedTypes: string[]; // Or a more specific enum/type if applicable
    content: Entity | null; // Or string if '<Entity>' is a placeholder string, null if empty
}

export default class EquipmentSlot extends Component {
    static allowMultiple: boolean = true;
    static keyProperty: string = 'name'; // Type for keyProperty
    static properties: EquipmentSlotProperties = {
        name: 'head',
        allowedTypes: ['hand'],
        content: null, // Initialize content as null, or handle '<Entity>' string appropriately
    };

    // Instance properties
    name!: string;
    allowedTypes!: string[];
    content!: Entity | null;

    // constructor(properties?: Partial<EquipmentSlotProperties>) {
    //     super(properties);
    // }

    // Renaming onDetached to onDestroyed for consistency with Component lifecycle
    onDestroyed(): void {
        // Access properties via `this.name` etc. after they are initialized by the super constructor
        console.log(
            `${this.name} slot removed from ${this.entity ? this.entity.id : 'unknown entity'}`
        );
    }
}
