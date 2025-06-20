import type { Entity } from './Entity';
import type { World } from './World';
import type { EntityEvent } from './EntityEvent';
export interface ComponentProperties {
    [key: string]: any;
}
export declare class Component {
    static allowMultiple: boolean;
    static keyProperty: string | null;
    static properties: ComponentProperties;
    _ckey: string;
    _cbit: bigint;
    entity: Entity;
    get world(): World;
    get allowMultiple(): boolean;
    get keyProperty(): string | null;
    constructor(properties?: Partial<ComponentProperties>);
    destroy(): void;
    _onDestroyed(): void;
    _onEvent(evt: EntityEvent): void;
    _onAttached(entity: Entity): void;
    serialize(): ComponentProperties;
    onAttached(entity: Entity): void;
    onDestroyed(): void;
    onEvent(evt: EntityEvent): void;
}
