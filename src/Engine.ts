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

    // Public method to get a component class by name
    public getComponentClass(name: string): ComponentClass | undefined {
        return this._components.get(name);
    }

    registerPrefab(data: PrefabData): void {
        this._prefabs.register(data);
    }

    // Public method to create a prefab instance
    public createPrefabInstance(world: World, name: string, properties: Partial<import('./Component').ComponentProperties> = {}): Entity | undefined {
        return this._prefabs.create(world, name, properties);
    }

    createWorld(): World {
        return new World(this);
    }

    destroyWorld(world: World): void {
        world.destroy();
    }
}
// Need to import Entity for the return type of createPrefabInstance
import type { Entity } from './Entity';
// ComponentProperties is also used, ensure it's properly typed or imported if needed by Partial
// It's already imported via `import type { Component } from './Component';` if ComponentProperties is from there.
// Let's be explicit for ComponentProperties if it's from './Component'
// import type { ComponentProperties } from './Component';
// Actually, createPrefabInstance uses Partial<import('./Component').ComponentProperties> which is fine.
