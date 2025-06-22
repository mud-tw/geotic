import { ComponentRegistry } from './ComponentRegistry';
import { PrefabRegistry, PrefabData } from './PrefabRegistry';
import { World } from './World';
import type { Component, ComponentProperties } from './Component';
import type { Entity } from './Entity';

/**
 * Defines the type for a component class constructor.
 * This allows the Engine to work with component classes directly.
 */
type ComponentClass = new (...args: any[]) => Component;

/**
 * The Engine is the central hub for an ECS (Entity-Component-System) application.
 * It manages the registration of components and prefabs, and is responsible for creating World instances.
 *
 * Relationships:
 * - Owns a `ComponentRegistry` to manage all known component types.
 * - Owns a `PrefabRegistry` to manage all defined entity prefabs (templates).
 * - Creates `World` instances, which are containers for entities and queries.
 */
export class Engine {
    /**
     * @private Internal registry for all component classes.
     * Manages how component types are identified and instantiated.
     */
    _components: ComponentRegistry = new ComponentRegistry();

    /**
     * @private Internal registry for all prefab definitions.
     * Manages how entity templates are defined and instantiated.
     * It requires a reference to the engine to access component definitions during prefab processing.
     */
    _prefabs: PrefabRegistry = new PrefabRegistry(this);

    /**
     * Registers a component class with the engine.
     * Once registered, components of this type can be added to entities.
     * This process typically assigns a unique identifier (like a bitmask or key) to the component class.
     *
     * @param clazz The component class constructor to register.
     * @example
     * class Position extends Component { static properties = {x:0, y:0}; }
     * engine.registerComponent(Position);
     */
    registerComponent(clazz: ComponentClass): void {
        this._components.register(clazz);
    }

    /**
     * Retrieves a registered component class constructor by its name (usually its camelCased class name).
     * This is used internally, for example, when deserializing entities or applying prefabs.
     *
     * @param name The string name (ckey) of the component class.
     * @returns The component class constructor if found, otherwise undefined.
     * @public
     */
    public getComponentClass(name: string): ComponentClass | undefined {
        return this._components.get(name);
    }

    /**
     * Registers a prefab definition with the engine.
     * Prefabs are templates that define a set of components and their initial properties
     * to quickly create pre-configured entities.
     *
     * @param data The prefab data object, which includes its name, inherited prefabs (if any),
     *             and a list of components with their properties.
     * @example
     * const enemyPrefab = {
     *   name: 'Enemy',
     *   components: [
     *     { type: 'Health', properties: { current: 100, max: 100 } },
     *     { type: 'Position', properties: { x: 0, y: 0 } }
     *   ]
     * };
     * engine.registerPrefab(enemyPrefab);
     */
    registerPrefab(data: PrefabData): void {
        this._prefabs.register(data);
    }

    /**
     * Creates an entity instance from a registered prefab within a specific world.
     * This method is typically called by `World.createPrefab()`.
     *
     * @param world The world in which to create the entity.
     * @param name The name of the prefab to instantiate.
     * @param properties Optional properties to override the prefab's default component values.
     * @returns The created Entity instance if the prefab exists, otherwise undefined.
     * @public
     */
    public createPrefabInstance(world: World, name: string, properties: Partial<ComponentProperties> = {}): Entity | undefined {
        return this._prefabs.create(world, name, properties);
    }

    /**
     * Creates a new World instance.
     * Each world is an independent container for entities, components, and queries.
     *
     * @returns A new World instance, linked to this engine.
     */
    createWorld(): World {
        return new World(this);
    }

    /**
     * Destroys a World instance.
     * This will typically involve destroying all entities and queries within that world.
     *
     * @param world The World instance to destroy.
     */
    destroyWorld(world: World): void {
        world.destroy();
    }
}
