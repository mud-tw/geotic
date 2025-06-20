import type { Entity } from './Entity';
import type PrefabComponent from './PrefabComponent';
interface PrefabProperties {
    [componentKey: string]: any;
}
export default class Prefab {
    name: string;
    inherit: Prefab[];
    components: PrefabComponent[];
    constructor(name: string);
    addComponent(prefabComponent: PrefabComponent): void;
    applyToEntity(entity: Entity, prefabProps?: PrefabProperties): Entity;
}
export {};
