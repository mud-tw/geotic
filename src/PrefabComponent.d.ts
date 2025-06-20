import type { Entity } from './Entity';
import type { Component } from './Component';
import type { ComponentProperties } from './Component';
export type ComponentClassWithMeta<T extends Component = Component> = (new (properties?: any) => T) & {
    allowMultiple?: boolean;
    prototype: {
        _ckey: string;
    };
};
export default class PrefabComponent {
    componentClass: ComponentClassWithMeta;
    properties: Partial<ComponentProperties>;
    overwrite: boolean;
    constructor(clazz: ComponentClassWithMeta, properties?: Partial<ComponentProperties>, overwrite?: boolean);
    applyToEntity(entity: Entity, initialProps?: Partial<ComponentProperties>): void;
}
