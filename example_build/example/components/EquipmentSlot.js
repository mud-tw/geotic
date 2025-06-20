import { Component } from '../../src'; // Assuming Entity is also exported
class EquipmentSlot extends Component {
    // constructor(properties?: Partial<EquipmentSlotProperties>) {
    //     super(properties);
    // }
    // Renaming onDetached to onDestroyed for consistency with Component lifecycle
    onDestroyed() {
        // Access properties via `this.name` etc. after they are initialized by the super constructor
        console.log(`${this.name} slot removed from ${this.entity ? this.entity.id : 'unknown entity'}`);
    }
}
EquipmentSlot.allowMultiple = true;
EquipmentSlot.keyProperty = 'name'; // Type for keyProperty
EquipmentSlot.properties = {
    name: 'head',
    allowedTypes: ['hand'],
    content: null, // Initialize content as null, or handle '<Entity>' string appropriately
};
export default EquipmentSlot;
