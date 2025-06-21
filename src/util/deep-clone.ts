// import deepClone as deepClone2 from "deep-clone";
// export deepClone from 'deep-clone'
import { deepCopy } from "deep-copy-ts";

// export deepClone;
export function deepClone<T>(obj: T): T {
    // Note: JSON.parse(JSON.stringify(obj)) has limitations:
    // - Loses functions and undefined values.
    // - Converts Dates to ISO strings.
    // - Doesn't handle circular references.
    // - Doesn't handle special types like Map, Set, RegExp, etc.
    // If these are issues, a more robust deep cloning library would be needed.
    // if (typeof obj === 'function' || obj === undefined) {
    //     // JSON.stringify would convert functions to null or omit them if they are properties
    //     // and undefined properties are omitted.
    //     // This implementation attempts to return the original value for functions/undefined
    //     // at the top level, but this doesn't solve nested cases or make it a true deep clone
    //     // for all types.
    //     return obj;
    // }
    try {
        // 使用 replacer 來處理 BigInt，因為原生的 JSON.stringify 不支援它。
        // 在序列化的情境下，將 BigInt 轉換為字串是可以接受的。
        // const replacer = (key: string, value: any) =>
        //     typeof value === 'bigint' ? value.toString() : value;
        // return JSON.parse(JSON.stringify(obj, replacer));
        return deepCopy(obj);
    } catch (e) {
        // Handle cases where JSON.stringify might fail (e.g., circular references, BigInt)
        console.error("deepClone failed:", e);
        // Fallback or rethrow, depending on desired error handling.
        // For now, returning the original object as a very basic fallback.
        return obj;
    }
}
