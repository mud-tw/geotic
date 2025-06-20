export function deepClone(obj) {
    // Note: JSON.parse(JSON.stringify(obj)) has limitations:
    // - Loses functions and undefined values.
    // - Converts Dates to ISO strings.
    // - Doesn't handle circular references.
    // - Doesn't handle special types like Map, Set, RegExp, etc.
    // If these are issues, a more robust deep cloning library would be needed.
    if (typeof obj === 'function' || obj === undefined) {
        // JSON.stringify would convert functions to null or omit them if they are properties
        // and undefined properties are omitted.
        // This implementation attempts to return the original value for functions/undefined
        // at the top level, but this doesn't solve nested cases or make it a true deep clone
        // for all types.
        return obj;
    }
    try {
        return JSON.parse(JSON.stringify(obj));
    }
    catch (e) {
        // Handle cases where JSON.stringify might fail (e.g., circular references, BigInt)
        console.error("deepClone failed:", e);
        // Fallback or rethrow, depending on desired error handling.
        // For now, returning the original object as a very basic fallback.
        return obj;
    }
}
//# sourceMappingURL=deep-clone.js.map