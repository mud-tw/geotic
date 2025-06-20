import { camelString } from './util/string-util';
import type { Entity } from './Entity'; // Optional: if entity needs to be part of event data

export class EntityEvent {
    name: string;
    data: { [key: string]: any };
    prevented: boolean = false;
    handled: boolean = false;
    handlerName: string;
    entity?: Entity; // The entity that fired the event (optional, can be set by the firer)

    constructor(name: string, data: { [key: string]: any } = {}) {
        this.name = name;
        this.data = data;
        this.handlerName = camelString(`on ${this.name}`);
    }

    is(name: string): boolean {
        return this.name === name;
    }

    handle(): void {
        this.handled = true;
        this.prevented = true;
    }

    prevent(): void {
        this.prevented = true;
    }
}
