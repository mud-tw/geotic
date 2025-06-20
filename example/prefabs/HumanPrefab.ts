import { PrefabData } from '../../src';

// import EquipmentSlot from '../components/EquipmentSlot'; // For type name verification
// import Material from '../components/Material'; // For type name verification

const HumanPrefab: PrefabData = {
    name: 'Human', // Changed from HumanPrefab
    inherit: ['Being'], // Changed BeingPrefab to Being, and ensured it's an array
    components: [
        {
            type: 'EquipmentSlot', // Assumes EquipmentSlot component class name
            properties: {
                name: 'head',
                allowedTypes: ['helmet', 'hat'],
            },
        },
        {
            type: 'EquipmentSlot',
            properties: {
                name: 'legs',
                allowedTypes: ['pants'],
            },
        },
        {
            type: 'Material', // Assumes Material component class name
            overwrite: false, // This property is part of PrefabComponentDataConfig in PrefabData
            properties: {
                name: 'stuff', // This will likely not overwrite the 'flesh' from BeingPrefab if Material is not allowMultiple
            },
        },
    ],
};

export default HumanPrefab;
