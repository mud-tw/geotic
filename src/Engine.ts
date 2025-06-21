import { ComponentRegistry } from './ComponentRegistry';
import { PrefabRegistry, PrefabData } from './PrefabRegistry';
import { World } from './World';
import type { Component } from './Component';

// Define a type for the component class (constructor)
type ComponentClass = new (...args: any[]) => Component;

export class Engine {
    _components: ComponentRegistry = new ComponentRegistry();
    _prefabs: PrefabRegistry = new PrefabRegistry(this);

    registerComponent(clazz: ComponentClass): void {
        this._components.register(clazz);
    }

    registerPrefab(data: PrefabData): void {
        this._prefabs.register(data);
    }

    createWorld(): World {
        return new World(this);
    }

    destroyWorld(world: World): void {
        world.destroy();
    }
}
