import { expr, RefinerFn } from "../types";
import { SUPPRESS } from "./index";

export class Cascade<T> {
  constructor(readonly value: T) {}
}

export interface ParsingExpressionOptions {
  ruleName?: string;
  refiner?: RefinerFn | typeof SUPPRESS | number | number[];

  skipws?: string | Cascade<string>;
  eolterm?: boolean | Cascade<boolean>;
  ignoreCase?: boolean;
}

// Shouldn't apply for classes with autoReduce=true
export type ParseManyOptions = ParsingExpressionOptions & { sep?: expr };

export type MatchOptions = Omit<ParsingExpressionOptions, "skipws" | "eolterm">;
