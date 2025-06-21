import camelcaseSlow from 'camelcase';
export {v4 as uuid} from 'uuid';

const camelCache: { [key: string]: string } = {};
export function camelString(value: string): string {
    if (value in camelCache) {
        return camelCache[value];
    }

    const result = camelcaseSlow(value);
    camelCache[value] = result;
    return result;
}
