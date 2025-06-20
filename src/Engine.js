import { ComponentRegistry } from './ComponentRegistry';
import { PrefabRegistry } from './PrefabRegistry';
import { World } from './World';
export class Engine {
    constructor() {
        this._components = new ComponentRegistry();
        this._prefabs = new PrefabRegistry(this);
    }
    registerComponent(clazz) {
        this._components.register(clazz);
    }
    registerPrefab(data) {
        this._prefabs.register(data);
    }
    createWorld() {
        return new World(this);
    }
    destroyWorld(world) {
        world.destroy();
    }
}
//# sourceMappingURL=Engine.js.map