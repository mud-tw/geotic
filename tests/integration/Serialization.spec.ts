import { Engine, World, Entity, ComponentClass, SerializedWorldData, SerializedEntity } from '../../src'; // Adjusted path
import {
    EmptyComponent,
    SimpleComponent,
    NestedComponent,
    ArrayComponent,
} from '../data/components'; // Adjusted path

// Use global chance instance if available
declare const chance: Chance.Chance;

describe('Serialization Integration Test', () => { // Renamed for clarity
    let world: World;
    let engine: Engine; // Added engine

    beforeEach(() => {
        engine = new Engine(); // Initialize engine

        engine.registerComponent(EmptyComponent as ComponentClass);
        engine.registerComponent(SimpleComponent as ComponentClass);
        engine.registerComponent(NestedComponent as ComponentClass);
        engine.registerComponent(ArrayComponent as ComponentClass);

        world = engine.createWorld();
    });

    describe('serializing', () => {
        let entity: Entity;
        let serializedData: SerializedWorldData;
        let nestedKeyA: string, nestedKeyB: string;
        let simpleCompProp: string;
        let arrayCompName1: string, arrayCompName2: string;

        beforeEach(() => {
            nestedKeyA = chance.word();
            nestedKeyB = chance.word();
            simpleCompProp = chance.string();
            arrayCompName1 = chance.word();
            arrayCompName2 = chance.word();

            entity = world.createEntity();
            entity.add(EmptyComponent);
            entity.add(SimpleComponent, { testProp: simpleCompProp });
            entity.add(ArrayComponent, { name: arrayCompName1 }); // Default hello: 'world'
            entity.add(ArrayComponent, { name: arrayCompName2 }); // Default hello: 'world'
            entity.add(NestedComponent, { name: nestedKeyA }); // Default hello & obprop
            entity.add(NestedComponent, { name: nestedKeyB }); // Default hello & obprop
        });

        describe('when no entities are specified (serialize entire world)', () => {
            beforeEach(() => {
                serializedData = world.serialize();
            });

            it('should save all entities and their component data', () => {
                // Note: Default values from component definitions are part of the serialized data
                // if not overridden, as per current Component.serialize() logic.
                const expectedEntityData: SerializedEntity = {
                    id: entity.id,
                    emptyComponent: {}, // EmptyComponent has no properties
                    simpleComponent: {
                        testProp: simpleCompProp,
                    },
                    arrayComponent: [ // Serialized as an array of property objects
                        { name: arrayCompName1, hello: 'world' }, // Assuming 'world' is default for ArrayComponent.hello
                        { name: arrayCompName2, hello: 'world' },
                    ],
                    nestedComponent: { // Serialized as an object map
                        [nestedKeyA]: { name: nestedKeyA, hello: 'world', obprop: { key: 'value', arr: [1,2,3] } }, // Assuming defaults
                        [nestedKeyB]: { name: nestedKeyB, hello: 'world', obprop: { key: 'value', arr: [1,2,3] } },
                    },
                };
                expect(serializedData.entities).toHaveLength(1);
                expect(serializedData.entities[0]).toEqual(expectedEntityData);
            });
        });

        describe('when a list of specific entities is specified', () => {
            let otherEntity: Entity;

            beforeEach(() => {
                otherEntity = world.createEntity('otherEntity');
                // Serialize only otherEntity and entity
                serializedData = world.serialize([otherEntity, entity]);
            });

            it('should only save specified entities and their component data', () => {
                 const expectedEntityData: SerializedEntity = {
                    id: entity.id,
                    emptyComponent: {},
                    simpleComponent: { testProp: simpleCompProp },
                    arrayComponent: [
                        { name: arrayCompName1, hello: 'world' },
                        { name: arrayCompName2, hello: 'world' },
                    ],
                    nestedComponent: {
                        [nestedKeyA]: { name: nestedKeyA, hello: 'world', obprop: { key: 'value', arr: [1,2,3] } },
                        [nestedKeyB]: { name: nestedKeyB, hello: 'world', obprop: { key: 'value', arr: [1,2,3] } },
                    },
                };
                const expectedOtherEntityData: SerializedEntity = { id: otherEntity.id };

                expect(serializedData.entities).toHaveLength(2);
                // Order might not be guaranteed, so check for presence and content
                expect(serializedData.entities).toContainEqual(expectedOtherEntityData);
                expect(serializedData.entities).toContainEqual(expectedEntityData);
            });
        });
    });

    describe('deserializing', () => {
        let sourceJson: SerializedWorldData;
        let entityId: string;
        let nestedNameA: string, nestedNameB: string;
        let simpleTestPropVal: string;
        let arrayName1Val: string, arrayHello1Val: string;
        let arrayName2Val: string, arrayHello2Val: string;
        let nestedHelloAVal: string, nestedHelloBVal: string;


        beforeEach(() => {
            entityId = chance.guid();
            nestedNameA = chance.word();
            nestedNameB = chance.word();
            simpleTestPropVal = chance.string();
            arrayName1Val = chance.word(); arrayHello1Val = chance.word();
            arrayName2Val = chance.word(); arrayHello2Val = chance.word();
            nestedHelloAVal = chance.word(); nestedHelloBVal = chance.word();


            sourceJson = {
                entities: [
                    {
                        id: entityId,
                        emptyComponent: {},
                        simpleComponent: { testProp: simpleTestPropVal },
                        arrayComponent: [ // Array of component property objects
                            { name: arrayName1Val, hello: arrayHello1Val },
                            { name: arrayName2Val, hello: arrayHello2Val },
                        ],
                        nestedComponent: { // Object map for keyed components
                            [nestedNameA]: { name: nestedNameA, hello: nestedHelloAVal, obprop: { key: 'testKeyA', arr: [10] } },
                            [nestedNameB]: { name: nestedNameB, hello: nestedHelloBVal, obprop: { key: 'testKeyB', arr: [20] } },
                        },
                    },
                ],
            };

            world.deserialize(sourceJson);
        });

        it('should allow the world to be serialized back into the same structure (deep equality)', () => {
            // Note: world.serialize() may not produce IDENTICAL objects if e.g. order of keys in maps is not guaranteed
            // or if default properties are added during serialization that weren't in original minimal JSON.
            // For this test, we assume serialize output for a deserialized world matches the input structure.
            expect(world.serialize()).toEqual(sourceJson);
        });

        it('should recreate entities with all their components', () => {
            const deserializedEntity = world.getEntity(entityId);
            expect(deserializedEntity).toBeDefined();
            expect(deserializedEntity).toBeInstanceOf(Entity);

            expect(deserializedEntity!.has(EmptyComponent)).toBe(true);
            expect(deserializedEntity!.has(SimpleComponent)).toBe(true);
            expect(deserializedEntity!.has(ArrayComponent)).toBe(true);
            expect(deserializedEntity!.has(NestedComponent)).toBe(true);
        });

        it('should correctly restore component properties', () => {
            const entity = world.getEntity(entityId)!; // Assert entity is defined

            const simple = (entity as any).simpleComponent as SimpleComponent;
            expect(simple.testProp).toEqual(simpleTestPropVal);

            const nestedMap = (entity as any).nestedComponent as Record<string, NestedComponent>;
            expect(nestedMap[nestedNameA].name).toEqual(nestedNameA);
            expect(nestedMap[nestedNameA].hello).toEqual(nestedHelloAVal);
            expect(nestedMap[nestedNameA].obprop).toEqual({ key: 'testKeyA', arr: [10] });


            expect(nestedMap[nestedNameB].name).toEqual(nestedNameB);
            expect(nestedMap[nestedNameB].hello).toEqual(nestedHelloBVal);
            expect(nestedMap[nestedNameB].obprop).toEqual({ key: 'testKeyB', arr: [20] });


            const arrayComps = (entity as any).arrayComponent as ArrayComponent[];
            expect(arrayComps).toHaveLength(2);
            expect(arrayComps.find(c => c.name === arrayName1Val)?.hello).toBe(arrayHello1Val);
            expect(arrayComps.find(c => c.name === arrayName2Val)?.hello).toBe(arrayHello2Val);
        });

        // TODO: Test deserializing an empty entities array: world.deserialize({ entities: [] });
        // TODO: Test deserializing data for an entity ID that already exists in the world.
        //       - What is the expected behavior? Overwrite components? Merge?
        // TODO: Test deserializing data containing an unknown component type (should warn and skip that component).
        // TODO: Test that queries are correctly updated after a world deserialization.
        //       - e.g., create a query, deserialize, then check query.get().
    });

    describe('serializing an empty world', () => {
        it('should return { entities: [] }', () => {
            const emptyWorld = engine.createWorld();
            expect(emptyWorld.serialize()).toEqual({ entities: [] });
        });
    });

    describe('entity.serialize() integration', () => {
        // TODO: Add a direct test for entity.serialize() to ensure it's working as expected
        //       within the context of registered components. (Unit test might also be appropriate).
        it.todo('should correctly serialize an individual entity');
    });
});
