import type { Entity } from './Entity';
export declare class EntityEvent {
    name: string;
    data: {
        [key: string]: any;
    };
    prevented: boolean;
    handled: boolean;
    handlerName: string;
    entity?: Entity;
    constructor(name: string, data?: {
        [key: string]: any;
    });
    is(name: string): boolean;
    handle(): void;
    prevent(): void;
}
