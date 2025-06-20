import camelcaseSlow from 'camelcase';

const camelCache: { [key: string]: string } = {};

export function camelString(value: string): string {
    if (value in camelCache) {
        return camelCache[value];
    }

    const result = camelcaseSlow(value);
    camelCache[value] = result;
    return result;
}
