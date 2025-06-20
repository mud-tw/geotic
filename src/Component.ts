import { deepClone } from './util/deep-clone';
import type { Entity } from './Entity';
import type { World } from './World';
import type { EntityEvent } from './EntityEvent';

export interface ComponentProperties { // Added export
    [key: string]: any;
}

export class Component {
    static allowMultiple: boolean = false;
    static keyProperty: string | null = null;
    static properties: ComponentProperties = {};

    _ckey!: string;
    _cbit!: bigint;

    entity!: Entity; // Initialized in _onAttached

    get world(): World {
        return this.entity.world;
    }

    get allowMultiple(): boolean {
        return (this.constructor as typeof Component).allowMultiple;
    }

    get keyProperty(): string | null {
        return (this.constructor as typeof Component).keyProperty;
    }

    constructor(properties: Partial<ComponentProperties> = {}) {
        const intrinsics = deepClone((this.constructor as typeof Component).properties);
        Object.assign(this, intrinsics, properties);
    }

    destroy(): void {
        this.entity.remove(this as any); // Cast to any to resolve type mismatch for now
    }

    _onDestroyed(): void {
        this.onDestroyed();
        // @ts-ignore: Delete entity after destruction
        delete this.entity;
    }

    _onEvent(evt: EntityEvent): void {
        this.onEvent(evt);

        if (typeof (this as any)[evt.handlerName] === 'function') {
            (this as any)[evt.handlerName](evt);
        }
    }

    _onAttached(entity: Entity): void {
        this.entity = entity;
        this.onAttached(entity);
    }

    serialize(): ComponentProperties {
        const ob: ComponentProperties = {};

        for (const key in (this.constructor as typeof Component).properties) {
            ob[key] = (this as any)[key];
        }

        return deepClone(ob);
    }

    onAttached(entity: Entity): void {}
    onDestroyed(): void {}
    onEvent(evt: EntityEvent): void {}
}
