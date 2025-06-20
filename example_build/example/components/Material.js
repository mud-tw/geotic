import { Component } from '../../src';
class Material extends Component {
    // constructor(properties?: Partial<MaterialProperties>) {
    //     super(properties);
    // }
    onAttached() {
        console.log(`${this.name} onAttached`, this.entity.id);
    }
    // Renaming onDetached to onDestroyed
    onDestroyed() {
        console.log(`${this.name} onDestroyed`, this.entity.id);
    }
}
Material.properties = {
    name: 'air',
};
export default Material;
