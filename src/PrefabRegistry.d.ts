import Prefab from './Prefab';
import type { Engine } from './Engine';
import type { World } from './World';
import type { Entity } from './Entity';
import type { ComponentProperties } from './Component';
interface PrefabComponentDataConfig {
    type: string;
    properties?: Partial<ComponentProperties>;
    overwrite?: boolean;
}
type PrefabComponentDataItem = string | PrefabComponentDataConfig;
export interface PrefabData {
    name: string;
    inherit?: string | string[];
    components?: PrefabComponentDataItem[];
    [key: string]: any;
}
export declare class PrefabRegistry {
    private _prefabs;
    private _engine;
    constructor(engine: Engine);
    deserialize(data: PrefabData): Prefab;
    getPrefabDataByName(name: string): PrefabData | undefined;
    register(data: PrefabData): void;
    get(name: string): Prefab | undefined;
    create(world: World, name: string, properties?: Partial<ComponentProperties>): Entity | undefined;
}
export {};
