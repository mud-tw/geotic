// Component Imports (assuming default exports from their .ts files)
import Material from './components/Material';
import Position from './components/Position';
import Listener from './components/Listener';
import Health from './components/Health';
import Action from './components/Action';
import EquipmentSlot from './components/EquipmentSlot';
// Prefab Imports (assuming default exports from their .ts files)
import BeingPrefab from './prefabs/BeingPrefab';
import HumanPrefab from './prefabs/HumanPrefab';
// Library Imports
import { Engine } from '../dist/geotic.es.js';
const ecs = new Engine();
const world = ecs.createWorld();
// Register Components - Cast to ComponentClass where necessary if constructor signature mismatch
ecs.registerComponent(EquipmentSlot);
ecs.registerComponent(Material);
ecs.registerComponent(Position);
ecs.registerComponent(Listener);
ecs.registerComponent(Health);
ecs.registerComponent(Action);
// Register Prefabs
ecs.registerPrefab(BeingPrefab); // Assumes BeingPrefab matches PrefabData structure
ecs.registerPrefab(HumanPrefab); // Assumes HumanPrefab matches PrefabData structure
const player = world.createEntity('player'); // Added optional ID
const sword = world.createEntity('sword');
sword.add(Material, { name: 'bronze' }); // Properties should match Material.properties
player.add(Position, { x: 4, y: 12 }); // Properties should match Position.properties
// Adding EquipmentSlot components
player.add(EquipmentSlot, {
    name: 'leftHand',
    allowedTypes: ['hand'],
    content: null // Explicitly null if empty, or assign an entity
});
player.add(EquipmentSlot, {
    name: 'rightHand',
    allowedTypes: ['hand'],
    content: sword // Example: equipping the sword
});
console.log(player.serialize());
const q = world.createQuery({
    all: [Position], // Component class directly
});
// Accessing component data - ensure 'position' is a valid accessor for Position component
// The dynamic accessor might not be known to TS without declaration merging or explicit casting.
// For now, assume `entity.position` works if Entity class has an index signature `[key: string]: any;`
q.get().forEach((e) => console.log(e.position));
// --- Typed versions of some commented out examples ---
// Example: Query with multiple conditions
// const exampleQuery: Query = world.createQuery({
//     all: [Action],          // entity must have all of these (Component classes)
//     any: [Health, Material], // entity must include at least one of these
//     none: [EquipmentSlot]    // entity cannot include any of these
// });
// Example: Accessing component properties
// Note: Direct dynamic access like `player.equipmentSlot.rightHand` is not type-safe by default.
// Use `player.get(EquipmentSlot, 'rightHand')` or similar if such a getter exists,
// or manage keyed components explicitly if needed.
// Assuming `Entity` might have a generic `get` method or specific accessors.
// For instance, if `player.components['equipmentSlot']` holds the keyed components:
const rightHandSlot = player.components['equipmentSlot']?.['rightHand'];
if (rightHandSlot) {
    console.log(rightHandSlot.allowedTypes);
    // rightHandSlot.content = sword; // This was done above with player.add
    console.log('Right hand content:', rightHandSlot.content?.id);
}
// Example: Serialize and Deserialize (assuming ecs2 is another Engine instance)
// const serializedWorldData = world.serialize(); // world.serialize() returns SerializedWorldData
// const ecs2 = new Engine();
// ecs2.registerComponent(EquipmentSlot as ComponentClass);
// ecs2.registerComponent(Material as ComponentClass);
// ecs2.registerComponent(Position as ComponentClass);
// ecs2.registerComponent(Listener as ComponentClass);
// ecs2.registerComponent(Health as ComponentClass);
// ecs2.registerComponent(Action as ComponentClass);
// ecs2.deserialize(serializedWorldData); // engine.deserialize would need to be implemented
// Example: Creating a prefab instance
const humanEntity = world.createPrefab('Human'); // Use 'Human', not 'HumanPrefab'
if (humanEntity) {
    console.log('Created Human:', humanEntity.id);
    humanEntity.add(Position, { x: 1, y: 1 }); // Can still add/override components
}
// Example: Event Firing
// const evt = humanEntity?.fireEvent('test', { some: 'data' });
// if (evt) {
//     console.log(evt.data);
//     console.log(evt.handled);
// }
// Example: Adding and removing multiple components (Action is allowMultiple=true)
// humanEntity?.add(Action, { name: 'attack', data: { target: 'enemy' } });
// humanEntity?.add(Action, { name: 'defend', data: { shieldUp: true } });
// const actions = humanEntity?.components['action'] as Action[] | undefined;
// if (actions && actions.length > 0) {
//     // actions[0].destroy(); // Call destroy on the component instance
// }
// console.log(humanEntity?.has(Action)); // Check if any Action components remain
// humanEntity?.remove(Action); // This would remove all Action components if Entity.remove is adapted for it
// console.log(humanEntity?.has(Action));
