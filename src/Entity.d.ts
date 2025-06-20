import { Component } from './Component';
import { EntityEvent } from './EntityEvent';
import type { World } from './World';
type ComponentClass<T extends Component = Component> = new (properties?: any) => T;
type EntityComponentStorage = Component | Component[] | {
    [key: string]: Component;
};
interface EntityComponents {
    [key: string]: EntityComponentStorage;
}
export interface SerializedEntity {
    id: string;
    [componentKey: string]: any;
}
export declare class Entity {
    world: World;
    id: string;
    components: EntityComponents;
    isDestroyed: boolean;
    _cbits: bigint;
    _qeligible: boolean;
    [key: string]: any;
    constructor(world: World, id: string);
    _candidacy(): void;
    add<T extends Component>(clazz: ComponentClass<T>, properties?: any): void;
    has<T extends Component>(clazz: ComponentClass<T> | (Function & {
        prototype: {
            _cbit: bigint;
        };
    })): boolean;
    remove(component: Component & {
        _ckey: string;
        _cbit: bigint;
        _onDestroyed: () => void;
    }): void;
    destroy(): void;
    serialize(): SerializedEntity;
    clone(): Entity;
    fireEvent(name: string, data?: any): EntityEvent;
}
export {};
