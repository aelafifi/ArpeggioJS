/**
 * Sentinel symbol used to skip overwriting a property when calling `withProps`.
 * Unlike `null` or `undefined`, which are treated as actual values, using `IGNORE`
 * tells `withProps` to leave that property unchanged.
 */
export const IGNORE = Symbol.for("Ignore");

/**
 * Temporarily overwrites properties on a source object while executing a callback,
 * then restores the original values afterward.
 *
 * Overwrites are reverted even if the callback throws an error.
 *
 * **Warning:** Using `withProps` in concurrent or asynchronous contexts may cause race conditions since it mutates the source object temporarily.
 *
 * **Warning:** Property values `null` and `undefined` are used as values,
 * but `IGNORE` can be used to skip overwriting a property for conditional cases.
 *
 * @param source The object whose properties will be temporarily overwritten.
 * @param overwrites An object containing the properties and values to overwrite on the source object.
 * @param callback A function to execute while the source object has the overwritten properties.
 *                 It receives the map of original property values as its argument.
 *
 * @example
 * ### Simple usage
 * ```javascript
 * const obj = { a: 1, b: 2 };
 * withProps(obj, { a: 10, b: 20 }, (originalValues) => {
 *     console.log(obj); // { a: 10, b: 20 }
 *     console.log(originalValues); // { a: 1, b: 2 }
 *     throw new Error("Test error");
 * });
 * console.log(obj); // { a: 1, b: 2 } - original values restored
 * ```
 *
 * ### Conditional overwrite using `IGNORE`
 * ```javascript
 * const obj = { x: 5, y: 10, z: 15 };
 * withProps(
 *    obj,
 *    { x: 50, y: obj.y > 100 ? 100 : IGNORE },
 *    (originalValues) => {
 *        console.log(obj); // { x: 50, y: 10, z: 15 } - only x is overwritten
 *        console.log(originalValues); // { x: 5 }
 *    },
 * );
 * console.log(obj); // { x: 5, y: 10, z: 15 } - original values restored
 * ```
 */
export function withProps(
  source: object,
  overwrites: object,
  callback: (originalValue: object) => void,
) {
  const originalValues: Record<string, any> = {};
  for (const key of Object.keys(overwrites)) {
    if (overwrites[key] !== IGNORE) {
      originalValues[key] = source[key];
      source[key] = overwrites[key];
    }
  }

  try {
    callback(originalValues);
  } finally {
    for (const key of Object.keys(overwrites)) {
      source[key] = originalValues[key];
    }
  }
}
