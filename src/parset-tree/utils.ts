import { RefinerFn } from "../types";
import { SUPPRESS } from "../parsing-expression";

export function getRefinerFunction(
  refiner?: RefinerFn | number | number[] | typeof SUPPRESS,
): Function | typeof SUPPRESS | undefined {
  if (refiner === SUPPRESS || typeof refiner === "function") {
    return refiner as any;
  }

  if (typeof refiner === "number") {
    return (value: any) => value[refiner];
  }

  if (Array.isArray(refiner)) {
    return (value: any) => refiner.map((i) => value[i]);
  }

  return (value: any) => value;
}
