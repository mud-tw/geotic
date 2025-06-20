// Component imports are not strictly necessary here for the prefab definition data,
// but they help ensure type names are correct if you want to cross-reference.
// import Position from '../components/Position';
// import Material from '../components/Material';
// import Listener from '../components/Listener';
// import Health from '../components/Health';
const BeingPrefab = {
    name: 'Being', // Changed from BeingPrefab to Being to match typical prefab naming
    components: [
        {
            type: 'Position', // Assumes Position component class name is 'Position'
            properties: {
                x: 4,
                y: 10,
            },
        },
        {
            type: 'Material', // Assumes Material component class name is 'Material'
            properties: {
                name: 'flesh',
            },
        },
        'Listener', // Assumes Listener component class name is 'Listener'
        'Health', // Assumes Health component class name is 'Health'
    ],
};
export default BeingPrefab;
