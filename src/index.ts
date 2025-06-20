export { Engine } from './Engine.js';
export { Component } from './Component.js';
export { ComponentRegistry } from './ComponentRegistry.js';
export { Entity } from './Entity.js';
export { EntityEvent } from './EntityEvent.js';
export { default as Prefab } from './Prefab.js'; // Prefab uses default export
export { default as PrefabComponent } from './PrefabComponent.js'; // PrefabComponent uses default export
export { PrefabRegistry } from './PrefabRegistry.js';
export { Query } from './Query.js';
export { World } from './World.js';

// Exporting relevant interfaces/types might also be useful for consumers
export type { ComponentProperties } from './Component.js';
export type { ComponentClass } from './ComponentRegistry.js';
export type { SerializedEntity } from './Entity.js';
export type { PrefabData } from './PrefabRegistry.js';
export type { QueryFilters, ComponentClassWithCBit } from './Query.js'; // Added ComponentClassWithCBit
// SerializedWorldData is not exported from World.ts, if needed it should be.
