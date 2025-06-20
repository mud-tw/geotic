import { ComponentRegistry } from './ComponentRegistry';
import { PrefabRegistry, PrefabData } from './PrefabRegistry';
import { World } from './World';
import type { Component } from './Component';
type ComponentClass = new (...args: any[]) => Component;
export declare class Engine {
    _components: ComponentRegistry;
    _prefabs: PrefabRegistry;
    registerComponent(clazz: ComponentClass): void;
    registerPrefab(data: PrefabData): void;
    createWorld(): World;
    destroyWorld(world: World): void;
}
export {};
