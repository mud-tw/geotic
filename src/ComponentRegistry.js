import { camelString } from './util/string-util';
export class ComponentRegistry {
    constructor() {
        this._cbit = 0;
        this._map = {};
    }
    register(clazz) {
        const key = camelString(clazz.name);
        // These properties are dynamically added to the prototype
        clazz.prototype._ckey = key;
        clazz.prototype._cbit = BigInt(++this._cbit);
        this._map[key] = clazz;
    }
    get(key) {
        return this._map[key];
    }
}
//# sourceMappingURL=ComponentRegistry.js.map