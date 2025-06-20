import camelcaseSlow from 'camelcase';
const camelCache = {};
export function camelString(value) {
    if (value in camelCache) {
        return camelCache[value];
    }
    const result = camelcaseSlow(value);
    camelCache[value] = result;
    return result;
}
//# sourceMappingURL=string-util.js.map