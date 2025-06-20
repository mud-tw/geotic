const ONE = 1n;
export function subtractBit(num, bit) {
    return num & ~(1n << bit);
}
export function addBit(num, bit) {
    return num | (ONE << bit);
}
export function hasBit(num, bit) {
    // Ensure 'bit' is not negative, as bitwise shifts with negative numbers are problematic or implementation-defined.
    // For positive 'bit', (num >> bit) % 2n !== 0n is equivalent to (num & (ONE << bit)) !== 0n
    if (bit < 0n) {
        // Or throw an error, depending on expected usage
        return false;
    }
    return (num & (ONE << bit)) !== 0n;
}
export function bitIntersection(n1, n2) {
    return n1 & n2;
}
//# sourceMappingURL=bit-util.js.map