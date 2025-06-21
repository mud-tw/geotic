import { Query } from "./Query";
import {
    World
} from "./World";

export class QueryManager {
    // 儲存所有的查詢
    private _queries: Query[] = [];

    // 儲存對應的世界
    private _world;

    /**
     * 建立一個新的查詢管理器
     * @param {World} world - 查詢管理器所屬的世界
     */
    constructor(world: World) {
        this._world = world;
    }

    get world() {
        return this._world;
    }

    addQuery(query: Query) {
        this._queries.push(query);
    }
}
