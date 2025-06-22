import { Query } from "./Query";
import { World } from "./World";

/**
 * The QueryManager class is intended to manage a collection of queries associated with a World.
 * In its current implementation, it primarily acts as a simple store for Query instances
 * and holds a reference to the World.
 *
 * Relationships:
 * - Associated with a specific `World` instance.
 * - Can hold multiple `Query` instances.
 *
 * Potential for Future Enhancement:
 * - Could be responsible for creating and caching queries to prevent duplicates.
 * - Could play a more active role in updating queries when entities change,
 *   though currently, the `World` class handles this directly.
 * - Might manage the lifecycle of queries more explicitly.
 *
 * Note: The current `World` implementation directly manages its list of queries and their updates.
 * This `QueryManager` seems to be more of a passive container or a placeholder for more advanced
 * query management features that are not yet fully implemented or utilized in the current system.
 */
export class QueryManager {
    /** @private An array to store Query instances managed by this manager. */
    private _queries: Query[] = [];

    /** @private A reference to the World instance this QueryManager is associated with. */
    private _world: World;

    /**
     * Creates a new QueryManager instance.
     * @param world The World instance that this manager will be associated with.
     */
    constructor(world: World) {
        this._world = world;
    }

    /**
     * Gets the World instance associated with this QueryManager.
     * @returns The World instance.
     */
    get world(): World {
        return this._world;
    }

    /**
     * Adds a Query instance to this manager's collection.
     * Note: In the current system, queries are typically created via `world.createQuery()`
     * and the world itself maintains its list of queries for updates. This method's utility
     * depends on how QueryManager is integrated into the overall ECS workflow.
     * @param query The Query instance to add.
     */
    addQuery(query: Query): void {
        this._queries.push(query);
    }

    // Potential future methods:
    // - removeQuery(query: Query): void
    // - getQueries(): Query[]
    // - createQuery(filters: QueryFilters): Query (potentially with caching)
}
