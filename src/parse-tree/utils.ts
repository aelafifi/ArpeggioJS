export function cachedProperty<T>(
  target: any,
  propertyName: string,
  descriptor: TypedPropertyDescriptor<T>,
) {
  if (!descriptor || typeof descriptor.get !== "function") {
    throw new Error("cachedProperty can only be applied to getters");
  }

  const originalGetter = descriptor.get;
  const cacheKey = Symbol(`__cached_${propertyName}`);

  descriptor.get = function (this: any) {
    if (!(cacheKey in this)) {
      this[cacheKey] = originalGetter.call(this);
    }
    return this[cacheKey];
  };

  return descriptor;
}
