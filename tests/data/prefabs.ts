import { PrefabData } from '@src/index'; // Adjusted path

export const EmptyPrefab: PrefabData = {
    name: 'EmptyPrefab',
    // No components needed for an empty prefab
};

export const SimplePrefab: PrefabData = {
    name: 'SimplePrefab',
    components: [
        {
            type: 'EmptyComponent', // Assumes component class name is 'EmptyComponent'
        },
        {
            type: 'SimpleComponent', // Assumes component class name is 'SimpleComponent'
            properties: { // These properties should match SimpleComponentProperties
                testProp: 'testPropValue',
            },
        },
    ],
};

export const PrefabWithKeyedAndArray: PrefabData = {
    name: 'PrefabWithKeyedAndArray',
    components: [
        {
            type: 'NestedComponent', // Assumes component class name is 'NestedComponent'
            properties: { // These properties should match NestedComponentProperties
                name: 'one',
                // hello: 'defaultHello', // Optional: provide all if not relying on defaults
                // obprop: { key: 'defaultKey', arr: [0] }
            },
        },
        {
            type: 'NestedComponent',
            properties: {
                name: 'two',
                // hello: 'anotherWorld',
                // obprop: { key: 'anotherKey', arr: [4,5,6] }
            },
        },
        {
            type: 'ArrayComponent', // Assumes component class name is 'ArrayComponent'
            properties: { // These properties should match ArrayComponentProperties
                name: 'a',
                // hello: 'world_a'
            },
        },
        {
            type: 'ArrayComponent',
            properties: {
                name: 'b',
                // hello: 'world_b'
            },
        },
    ],
};
