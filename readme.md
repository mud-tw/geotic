#### geotic

_adjective_ physically concerning land or its inhabitants.

Geotic is an ECS library focused on **performance**, **features**, and **non-intrusive design**. [View benchmarks](https://github.com/ddmills/js-ecs-benchmarks).

-   [**entity**](#entity) a unique id and a collection of components
-   [**component**](#component) a data container
-   [**query**](#query) a way to gather collections of entities that match some criteria, for use in systems
-   [**world**](#world) a container for entities and queries
-   [**prefab**](#prefab) a template of components to define entities as JSON
-   [**event**](#event) a message to an entity and its components

This library is _heavily_ inspired by ECS in _Caves of Qud_. Watch these talks to get inspired!

-   [Thomas Biskup - There be dragons: Entity Component Systems for Roguelikes](https://www.youtube.com/watch?v=fGLJC5UY2o4&t=1534s)
-   [Brian Bucklew - AI in Qud and Sproggiwood](https://www.youtube.com/watch?v=4uxN5GqXcaA)
-   [Brian Bucklew - Data-Driven Engines of Qud and Sproggiwood](https://www.youtube.com/watch?v=U03XXzcThGU)

Python user? Check out the Python port of this library, [ecstremity](https://github.com/krummja/ecstremity)!

### usage and examples

```
npm install geotic
```

-   [Sleepy Crawler](https://github.com/ddmills/sleepy) a full fledged roguelike that makes heavy use of geotic by [@ddmills](https://github.com/ddmills)
-   [snail6](https://github.com/luetkemj/snail6) a bloody roguelike by [@luetkemj](https://github.com/luetkemj)
-   [Gobs O' Goblins](https://github.com/luetkemj/gobs-o-goblins) by [@luetkemj](https://github.com/luetkemj)
-   [Javascript Roguelike Tutorial](https://github.com/luetkemj/jsrlt) by [@luetkemj](https://github.com/luetkemj)
-   [basic example](https://github.com/ddmills/geotic-example) using pixijs

Below is a contrived example which shows the basics of geotic:

```typescript
import { Engine, Component, World, Entity, EntityEvent, PrefabData, Query } from 'geotic'; // Assuming Query is exported for type usage if needed.

// Define some simple components
class Position extends Component {
    static properties: { x: number; y: number } = {
        x: 0,
        y: 0,
    };
    x!: number; // Definite assignment assertion
    y!: number;
}

class Velocity extends Component {
    static properties: { x: number; y: number } = {
        x: 0,
        y: 0,
    };
    x!: number;
    y!: number;
}

class IsFrozen extends Component {}

const engine: Engine = new Engine();

// All Components and Prefabs must be `registered` by the engine
engine.registerComponent(Position);
engine.registerComponent(Velocity);
engine.registerComponent(IsFrozen);

// ...
// Create a world to hold and create entities and queries
const world: World = engine.createWorld();

// Create an empty entity. Call `entity.id` to get the unique ID.
const entity: Entity = world.createEntity();

// Add some components to the entity
entity.add(Position, { x: 4, y: 10 });
entity.add(Velocity, { x: 1, y: 0.25 });

// Create a query that tracks all components that have both a `Position`
// and `Velocity` component but not a `IsFrozen` component. A query can
// have any combination of `all`, `none` and `any`
const kinematics: Query = world.createQuery({
    all: [Position, Velocity], // Pass component classes directly
    none: [IsFrozen]
});

// ...

// Geotic does not dictate how your game loop should behave
const loop = (dt: number): void => {
    // Loop over the result set to update the position for all entities
    // in the query. The query will always return an up-to-date array
    // containing entities that match
    kinematics.get().forEach((entity: Entity) => {
        // Assuming Position and Velocity components add properties to the entity directly
        // For type safety, you might need entity.get(Position).x or cast entity to an extended type.
        const pos = entity.get(Position); // Example of safer access
        const vel = entity.get(Velocity);
        if (pos && vel) {
            pos.x += vel.x * dt;
            pos.y += vel.y * dt;
        }
    });
};

// ...

// Serialize all world entities into a JS object
const data = world.serialize();

// ...

// Convert the serialized data back into entities and components
world.deserialize(data);

```

### Engine

The `Engine` class is used to register all components and prefabs, and create new Worlds.

```typescript
import { Engine, World, Component, PrefabData } from 'geotic';

const engine: Engine = new Engine();

// Example Component class
class MyComponent extends Component {
    static properties = { value: 10 };
    value!: number;
}

// Example Prefab data structure
const myPrefab: PrefabData = {
    name: 'MyPrefab',
    components: [{ type: 'MyComponent', properties: { value: 100 } }]
};

engine.registerComponent(MyComponent);
engine.registerPrefab(myPrefab);

const worldInstance: World = engine.createWorld(); // From previous example
engine.destroyWorld(worldInstance);
```

Engine properties and methods:

-   **registerComponent(clazz: typeof Component)**: Register a Component so it can be used by entities. Components should generally be registered before creating worlds or entities that use them.
-   **registerPrefab(data: PrefabData)**: Register a Prefab to create pre-defined entities. Prefabs should generally be registered before creating worlds or entities from them.
-   **destroyWorld(world: World)**: Destroy a world instance.

### World

The `World` class is a container for entities. Usually only one instance is needed,
but it can be useful to spin up more for offscreen work.

```typescript
import { Engine, World, Entity, PrefabData, Query } from 'geotic';

const engine: Engine = new Engine(); // Assume engine is initialized
const world: World = engine.createWorld();

// Create/destroy entities
const newEntity: Entity = world.createEntity();
const entityId: string = newEntity.id;
const retrievedEntity: Entity | undefined = world.getEntity(entityId);
const allEntities: IterableIterator<Entity> = world.getEntities(); // Note: this is an iterator
world.destroyEntity(entityId); // or world.destroyEntity(newEntity)
world.destroyEntities();

// Create queries
// Assuming Position is a registered Component class
const query: Query = world.createQuery({ all: [Position] });

// Create entity from prefab
// Assuming 'MyPrefab' is registered and MyComponent is part of it
const prefabEntity: Entity | undefined = world.createPrefab('MyPrefab', { MyComponent: { value: 200 } });

// Serialize/deserialize entities
const serializedData = world.serialize();
const entitiesToSerialize: Entity[] = [prefabEntity!]; // Example: specific entities
const partialSerializedData = world.serialize(entitiesToSerialize);
world.deserialize(serializedData);

// Create an entity with a new ID and identical components & properties
if (prefabEntity) {
    const clonedEntity: Entity = world.cloneEntity(prefabEntity);
}

// Generate unique entity id
const uniqueId: string = world.createId();

// Destroy all entities and queries
world.destroy();
```

World properties and methods:

-   **createEntity(id?: string): Entity**: Create an `Entity`. Optionally provide an ID.
-   **getEntity(id: string): Entity | undefined**: Get an `Entity` by ID.
-   **getEntities(): IterableIterator<Entity>**: Get _all_ entities in this world.
-   **createPrefab(name: string, properties: Record<string, any> = {}): Entity | undefined**: Create an entity from the registered prefab. The `properties` object can be used to override default component values, including deeply nested properties (see prefab examples).
-   **destroyEntity(entityOrId: Entity | string)**: Destroys an entity. Functionally equivalent to `entity.destroy()`.
-   **destroyEntities()**: Destroys all entities in this world instance.
-   **serialize(entities?: Iterable<Entity> | Map<string, Entity>): SerializedWorldData**: Serialize and return all entity data into an object. Optionally specify a list of entities to serialize.
-   **deserialize(data: SerializedWorldData)**: Deserialize an object.
-   **cloneEntity(entity: Entity): Entity**: Clone an entity.
-   **createId(): string**: Generates a unique ID.
-   **destroy()**: Destroy all entities and queries in the world.

### Entity

A unique id and a collection of components.
Accessing components directly (e.g., `entity.position`) depends on the library's specific implementation for attaching component instances to entity objects. In strictly typed TypeScript, if such dynamic properties are not automatically declared on the `Entity` type, you might need to use `entity.get(ComponentType)` or type casting for type safety. The examples below show the intended dynamic usage.

```typescript
import { Entity, World, Component, EntityEvent } from 'geotic'; // Assuming these are available

// Define example components for context
class Name extends Component { static properties = { value: "" }; value!: string; }
class Position extends Component { static properties = { x:0, y:0, z:0 }; x!:number; y!:number; z!:number; }
class Velocity extends Component { static properties = { x:0, y:0, z:0 }; x!:number; y!:number; z!:number; }
class Health extends Component { static properties = { value: 0 }; value!: number; }
class Enemy extends Component {}

// Assume world and components are registered
declare const world: World; // From a previous setup
world.engine.registerComponent(Name);
world.engine.registerComponent(Position);
world.engine.registerComponent(Velocity);
world.engine.registerComponent(Health);
world.engine.registerComponent(Enemy);


const zombie: Entity = world.createEntity();

zombie.add(Name, { value: 'Donnie' });
zombie.add(Position, { x: 2, y: 0, z: 3 });
zombie.add(Velocity, { x: 0, y: 0, z: 1 });
zombie.add(Health, { value: 200 });
zombie.add(Enemy);

// Assuming direct property access for components; type safety may require entity.get(Name)
(zombie.get(Name) as Name).value = 'George';
(zombie.get(Velocity) as Velocity).x += 12;

// Firing an event with specific data
zombie.fireEvent('hit', { damage: 12 });

const zombieHealth = zombie.get(Health) as Health;
if (zombieHealth && zombieHealth.value <= 0) {
    zombie.destroy();
}
```

Entity properties and methods:

-   **id: string**: The entity's unique ID.
-   **world: World**: The Geotic World instance this entity belongs to.
-   **isDestroyed: boolean**: Returns `true` if this entity has been destroyed.
-   **components: Record<string, Component | Component[] | Record<string, Component>>**: All component instances attached to this entity. Access components directly (e.g., `entity.position`). For components with `allowMultiple=true`, access them as an array (e.g., `entity.impulses[0]`) or as an object if `keyProperty` is set (e.g., `entity.equipmentSlot.head`). (Note: for type safety, prefer `entity.get(ComponentType)`).
-   **add<T extends Component>(ComponentClazz: typeof T, props?: Partial<InstanceType<typeof T>['__props__']>)**: Create and add the registered component to the entity.
-   **has(ComponentClazz: typeof Component): boolean**: Returns `true` if the entity has the component.
-   **get<T extends Component>(ComponentClazz: typeof T): InstanceType<typeof T> | undefined**: Retrieves a single instance component. (Actual method signature might vary, this is a common pattern).
-   **getAll<T extends Component>(ComponentClazz: typeof T): InstanceType<typeof T>[] | undefined**: Retrieves all instances for a multi-component. (Actual method signature might vary).
-   **getByKey<T extends Component>(ComponentClazz: typeof T, key: string): InstanceType<typeof T> | undefined**: Retrieves a keyed multi-component. (Actual method signature might vary).
-   **owns(component: Component): boolean**: Returns `true` if the specified component instance belongs to this entity.
-   **remove(componentOrClazz: Component | typeof Component)**: Remove a component instance or all components of a class from the entity and destroy it/them.
-   **destroy()**: Destroy the entity and all of its components.
-   **serialize(): SerializedEntity**: Serialize this entity and its components.
-   **clone(): Entity**: Returns a new entity with a new unique ID and identical components & properties.
-   **fireEvent(name: string, data?: any): EntityEvent**: Send an event to all components on the entity.

### Component

Components hold entity data. A component must be defined and then registered with the Engine.

```typescript
import { Component, Entity, EntityEvent, World } from 'geotic';

interface HealthProperties {
    current: number;
    maximum: number;
}

class Health extends Component {
    // These define the default values and the serializable shape of the component.
    static properties: HealthProperties = {
        current: 10,
        maximum: 10,
    };

    // Declare instance properties for type safety
    current!: number;
    maximum!: number;

    // Arbitrary helper methods and properties can be declared on components.
    // Note that these will NOT be serialized.
    get isAlive(): boolean {
        return this.current > 0;
    }

    reduce(amount: number): void {
        this.current = Math.max(this.current - amount, 0);
    }

    heal(amount: number): void {
        this.current = Math.min(this.current + amount, this.maximum);
    }

    // This is automatically invoked when a `damage-taken` event is fired
    // on the entity: `entity.fireEvent('damage-taken', { damage: 12 })`
    // The `camelcase` library is used to map event names to methods.
    onDamageTaken(evt: EntityEvent<{ damage: number }>): void {
        // Event `data` is an arbitrary object passed as the second parameter
        // to entity.fireEvent(...)
        this.reduce(evt.data.damage);

        // Handling the event will prevent it from continuing
        // to any other components on the entity.
        evt.handle();
    }

    // Example of a generic event handler
    onEvent(evt: EntityEvent): void {
        console.log(`Health component received event: ${evt.name}`);
    }
    
    // Example lifecycle method
    onAttached(entity: Entity): void {
        console.log(`Health component attached to entity ${entity.id}`);
        // Useful for initialization logic, such as setting up subscriptions or initial calculations.
    }

    // Example lifecycle method
    onDestroyed(): void {
        console.log(`Health component on entity ${this.entity.id} destroyed`);
        // Useful for cleanup logic, like clearing timers or releasing resources.
    }
}
```

Component properties and methods:

-   **static properties = {}**: Object that defines the default properties and the serializable shape of the component. Properties must be JSON serializable and de-serializable!
-   **static allowMultiple = false**: Are multiple instances of this component type allowed on a single entity? If true, components will be stored either as an array or an object on the entity, depending on `keyProperty`.
-   **static keyProperty = null**: If `allowMultiple` is true, what property of the component should be used as the key for accessing this component via `entity.componentType.key`? If this property is omitted and `allowMultiple` is true, components are stored as an array.
-   **entity: Entity**: Returns the Entity this component is attached to.
-   **world: World**: Returns the World this component is in.
-   **isDestroyed: boolean**: Returns `true` if this component has been destroyed.
-   **serialize(): Record<string, any>**: Serialize the component properties defined in `static properties`.
-   **destroy()**: Remove this component from its entity and destroy it.
-   **onAttached(entity: Entity)**: Override this method to add behavior when this component is attached (added) to an entity. Useful for initialization logic, such as setting up subscriptions or initial calculations.
-   **onDestroyed()**: Override this method to add behavior when this component is removed & destroyed. Useful for cleanup logic, like clearing timers or releasing resources.
-   **onEvent(evt: EntityEvent)**: Override this method to capture all events sent to the entity this component is on.
-   **on[EventName](evt: EntityEvent)**: Implement methods with this naming convention (e.g., `onTakeDamage(evt)`) to capture specific events. If both `onEvent` and a specific `on[EventName]` handler exist, `onEvent` is typically called before the specific handler, but check library implementation for exact order. Event processing stops if `evt.handle()` or `evt.prevent()` is called.

This example shows how `allowMultiple` and `keyProperty` work:

```typescript
import { Engine, Component, Entity, World } from 'geotic'; // Assume these are available
declare const engine: Engine; // From a previous setup
declare const world: World; // From a previous setup


class Impulse extends Component {
    static properties: { x: number; y: number } = {
        x: 0,
        y: 0,
    };
    x!: number;
    y!: number;
    static allowMultiple: boolean = true;
}

engine.registerComponent(Impulse);

// ...
const player: Entity = world.createEntity();

// Add multiple `Impulse` components to the player
player.add(Impulse, { x: 3, y: 2 });
player.add(Impulse, { x: 1, y: 0 });
player.add(Impulse, { x: 5, y: 6 });

// ...

// Access the array of Impulse components (type assertion for clarity)
const impulses = player.get(Impulse) as Impulse[]; // Or a more specific accessor if available
if (impulses) {
    // Returns the Impulse at position `2`
    console.log(impulses[2]);
    
    impulses.forEach((impulse: Impulse) => {
        console.log(impulse.x, impulse.y);
    });
    // Remove and destroy the first impulse
    impulses[0].destroy();
}
// Returns `true` if the entity has any `Impulse` component
console.log(player.has(Impulse));


// ...

class EquipmentSlot extends Component {
    static properties: { name: string; itemId: string | null } = { // Assuming itemId is string (entity.id) or null
        name: 'hand',
        itemId: null,
    };
    name!: string;
    itemId!: string | null;

    static allowMultiple: boolean = true;
    static keyProperty: string = 'name';

    get item(): Entity | undefined {
        return this.itemId ? this.world.getEntity(this.itemId) : undefined;
    }

    set item(entity: Entity | undefined) {
        this.itemId = entity ? entity.id : null;
    }
}

engine.registerComponent(EquipmentSlot);

// ...

const helmet: Entity = world.createEntity();
const sword: Entity = world.createEntity();

// Add multiple equipment slot components to the player
player.add(EquipmentSlot, { name: 'rightHand' });
player.add(EquipmentSlot, { name: 'leftHand', itemId: sword.id });
player.add(EquipmentSlot, { name: 'head', itemId: helmet.id });

// ...

// Since `EquipmentSlot` had `keyProperty='name'`, access them via the key
// (Type assertion or specific getter needed for type safety)
const headSlot = player.get(EquipmentSlot, 'head') as EquipmentSlot; 
const rightHandSlot = player.get(EquipmentSlot, 'rightHand') as EquipmentSlot;

if (headSlot) console.log(headSlot.name);
if (rightHandSlot) console.log(rightHandSlot.name);


// Example: Clearing an item (assuming direct property access for example, use setter for safety)
if (rightHandSlot) {
    // This would `destroy` the `sword` entity if it was assigned to rightHandSlot
    // and if it's the only reference.
    // If `rightHandSlot.item` holds the sword entity:
    // rightHandSlot.item?.destroy(); // This destroys the sword entity itself.
    // To just clear the slot:
    rightHandSlot.item = undefined; 
}


// Remove and destroy the `rightHand` equipment slot component itself
rightHandSlot?.destroy();

```

### Query

Queries keep track of sets of entities defined by component types. They are limited to the world they're created in.

```typescript
import { World, Entity, Component, Query } from 'geotic'; // Assume these are available
declare const world: World; // From a previous setup

// Define example components
class A extends Component {}
class B extends Component {}
class C extends Component {}
class D extends Component {}
class E extends Component {}
class F extends Component {}


const query: Query = world.createQuery({
    any: [A, B],  // Exclude any entity that does not have at least one of A OR B.
    all: [C, D],  // Exclude entities that don't have both C AND D.
    none: [E, F], // Exclude entities that have E OR F.
});

query.get().forEach((entity: Entity) => { /* ... */ }); // Loop over the latest set (array) of entities that match

// Alternatively, listen for when an individual entity is created/updated that matches
query.onEntityAdded((entity: Entity) => {
    console.log('An entity was updated or created that matches the query!', entity.id);
});

query.onEntityRemoved((entity: Entity) => {
    console.log('An entity was updated or destroyed that previously matched the query!', entity.id);
});
```

-   **query.get(): Entity[]**: Get the result array of the query. By default, this is a copy.
-   **onEntityAdded(fn: (entity: Entity) => void)**: Add a callback for when an entity is created or updated to match the query. These callbacks are useful for reactive systems that respond to individual entity changes without needing to iterate the full query result set each frame.
-   **onEntityRemoved(fn: (entity: Entity) => void)**: Add a callback for when an entity is removed or updated to no longer match the query. These callbacks are useful for reactive systems that respond to individual entity changes without needing to iterate the full query result set each frame.
-   **has(entity: Entity): boolean**: Returns `true` if the given `entity` is being tracked by the query. Mostly used internally.
-   **refresh()**: Re-check all entities to see if they match. Very expensive, and only used internally.

#### Performance enhancement (immutableResult)

Set the `immutableResult` option to `false` if you are not modifying the result set and need maximum performance. This option defaults to `true`. **WARNING**: When this option is set to `false`, the array returned by `get()` is the direct internal cache. Modifying this array can lead to inconsistent query states or errors. Defaults to `true` for safety, which returns a copy.

```typescript
// Assuming A and B are registered Component classes
declare const A: typeof Component;
declare const B: typeof Component;

const query: Query = world.createQuery({
    all: [A, B],
    immutableResult: false, // Defaults to true
});

const results: Entity[] = query.get();

// results.splice(0, 1); // DANGER! Do not modify results if immutableResult is false!
```

### Serialization

Only component properties defined in their `static properties` will be serialized. Methods and other runtime state are not included.

**Example**: Save game state by serializing all entities and components.

```typescript
import { World } from 'geotic'; // Assume World is available
declare const world: World;   // From a previous setup

const saveGame = (): void => {
    const data = world.serialize(); // Returns SerializedWorldData
    // Note: JSON.stringify can't directly serialize BigInt, Map, Set etc.
    // The library's serialize method should produce plain JS objects.
    localStorage.setItem('savegame', JSON.stringify(data));
};

const loadGame = (): void => {
    const rawData = localStorage.getItem('savegame');
    if (rawData) {
        const data = JSON.parse(rawData); // data should be SerializedWorldData
        world.deserialize(data);
    }
};
```

### Event

Events are used to send a message to all components on an entity. Components can attach data to the event and prevent it from continuing to other entities.

The geotic event system is modelled after this talk by [Brian Bucklew - AI in Qud and Sproggiwood](https://www.youtube.com/watch?v=4uxN5GqXcaA).

```typescript
import { Component, Entity, EntityEvent } from 'geotic'; // Assume these are available

// A `Health` component which listens for a `take-damage` event
class Health extends Component {
    static properties = { value: 10 };
    value!: number;

    // Event names are mapped to methods using the `camelcase` library.
    // e.g., 'take-damage' maps to 'onTakeDamage'
    onTakeDamage(evt: EntityEvent<{ amount: number }>): void {
        console.log(evt);
        this.value -= evt.data.amount;

        // The event gets passed to all components on the `entity` unless a component
        // invokes `evt.prevent()` or `evt.handle()`.
        evt.handle();
    }

    // Watch ALL events coming to this component
    onEvent(evt: EntityEvent): void {
        console.log(`Event received by Health component: ${evt.name}`);
        if (evt.is('take-damage')) {
            console.log('It was a take-damage event.');
        }
    }
}

declare const entity: Entity; // Assume an entity is created and Health component is added
// entity.add(Health);

// Fire the event
const eventResult: EntityEvent = entity.fireEvent('take-damage', { amount: 12 });

console.log(eventResult.name);     // "take-damage"
console.log(eventResult.data);     // { amount: 12 }
console.log(eventResult.handled);  // true, because onTakeDamage called evt.handle()
console.log(eventResult.prevented); // true, because evt.handle() also prevents
// evt.handle(); // No need to call again here
// evt.prevent(); 
console.log(eventResult.is('take-damage')); // true
```

### Prefab

Prefabs are a pre-defined template of components.
The prefab system is modelled after this talk by [Thomas Biskup - There be dragons: Entity Component Systems for Roguelikes](https://www.youtube.com/watch?v=fGLJC5UY2o4&t=1534s).

```typescript
import { Engine, World, PrefabData } from 'geotic'; // Assume these are available
declare const engine: Engine; // From a previous setup
declare const world: World;   // From a previous setup

// Example components (ensure they are registered with the engine)
class Position extends Component { static properties = { x:0, y:0 }; x!:number; y!:number; }
class Material extends Component { static properties = { name: "" }; name!:string; }
class EquipmentSlot extends Component { static properties = { name:"", itemId: null as string|null }; name!:string; itemId!:string|null; }
class WarriorSkills extends Component {} // Example, assuming registered

engine.registerComponent(Position);
engine.registerComponent(Material);
engine.registerComponent(EquipmentSlot);
engine.registerComponent(WarriorSkills);


// Prefabs must be registered before they can be instantiated
const beingPrefab: PrefabData = {
    name: 'Being',
    components: [
        {
            type: 'Position', // Corresponds to registered component class name
            properties: {
                x: 4,
                y: 10,
            },
        },
        {
            type: 'Material',
            properties: {
                name: 'flesh',
            },
        },
    ],
};
engine.registerPrefab(beingPrefab);

const warriorPrefab: PrefabData = {
    name: 'Warrior',
    components: [{ type: 'WarriorSkills' }]
};
engine.registerPrefab(warriorPrefab);


const humanWarriorPrefab: PrefabData = {
    name: 'HumanWarrior',
    // An array of other registered prefab names from which this one inherits.
    // The order of prefab names in the `inherit` array matters for how properties are overridden.
    // Child prefabs can overwrite components and properties from parent prefabs.
    inherit: ['Being', 'Warrior'],
    components: [
        {
            type: 'EquipmentSlot',
            properties: { name: 'head' },
        },
        {
            type: 'EquipmentSlot',
            properties: { name: 'legs' },
        },
        {
            type: 'Material',
            // If a parent prefab (e.g., 'Being') already defines a `Material` component,
            // this flag says how to treat it. Defaults to overwrite=true.
            // If `overwrite: false` and Material is not `allowMultiple`, this component might be ignored.
            overwrite: true, 
            properties: { name: 'silver' },
        },
    ],
};
engine.registerPrefab(humanWarriorPrefab);

// ...

const warrior1: Entity | undefined = world.createPrefab('HumanWarrior');

// Property overrides can be provided as the second argument
const helmetEntity: Entity = world.createEntity(); // Assuming a helmet entity is created
const warrior2: Entity | undefined = world.createPrefab('HumanWarrior', {
    // Component data overrides. 'EquipmentSlot' should match the component's ckey.
    // The structure for overriding keyed/multiple components depends on library implementation.
    // This example assumes component type name (or ckey) as top-level key.
    EquipmentSlot: { // This might be 'equipmentSlot' (camelCase ckey)
        head: { // If EquipmentSlot.keyProperty is 'name'
            itemId: helmetEntity.id
        },
    },
    Position: { // This might be 'position'
        x: 12,
        y: 24,
    },
});
```

### Future Enhancements

While Geotic is already powerful and feature-rich, here are some potential directions for future enhancements:

*   **Asynchronous Operations**: Explore robust support for asynchronous tasks within component lifecycle methods (e.g., `onAttached`) or event handlers, perhaps for fetching external data or handling long-running processes.
*   **Advanced Querying**: Introduce more sophisticated query capabilities, such as sorting entities by component property values or filtering based on runtime data directly within the query definition.
*   **State Snapshotting and Diffing**: Implement tools for creating world state snapshots and generating diffs between states, useful for features like undo/redo, game replays, or optimizing network synchronization.
*   **Web Worker Offloading**: Provide mechanisms or examples for offloading computationally intensive systems or queries to Web Workers to improve main thread performance.
*   **Developer Tools & Inspector**: Create a browser extension or an in-game overlay panel for inspecting entities, their components, system performance, and query results in real-time.
*   **Expanded Rendering/Framework Integrations**: Offer more official examples, wrappers, or utility libraries for integrating Geotic with popular rendering engines (e.g., Three.js, Babylon.js) or UI frameworks.
*   **Component Groups/Tags**: Allow for more flexible entity categorization beyond component presence, such as tagging entities or grouping components, to enable more nuanced querying logic.
*   **Hot Module Replacement (HMR) for Components/Systems**: Improve the developer experience by allowing components and systems to be updated live during development without losing application state (might be partially available with Vite, but could be enhanced).
