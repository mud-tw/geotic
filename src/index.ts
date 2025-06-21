export { Engine } from './Engine';
export { Component } from './Component';
export { ComponentRegistry } from './ComponentRegistry';
export { Entity } from './Entity';
export { EntityEvent } from './EntityEvent';
export { default as Prefab } from './Prefab'; // Prefab uses default export
export { default as PrefabComponent } from './PrefabComponent'; // PrefabComponent uses default export
export { PrefabRegistry } from './PrefabRegistry';
export { Query } from './Query';
export { World } from './World';

// Exporting relevant interfaces/types might also be useful for consumers
export type { ComponentProperties } from './Component';
export type { ComponentClass } from './ComponentRegistry';
export type { SerializedEntity } from './Entity';
export type { SerializedWorldData } from './World';
export type { PrefabData } from './PrefabRegistry';
export type { QueryFilters, ComponentClassWithCBit } from './Query'; // Added ComponentClassWithCBit
// SerializedWorldData is not exported from World.ts, if needed it should be.

export { ONE, addBit, subtractBit, hasBit, bitIntersection } from './util/bit-util';
export { deepClone } from './util/deep-clone';
export { camelString, uuid } from './util/string-util';
