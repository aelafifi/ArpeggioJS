import { GrammarDef, RefinerFn } from "../types";
import { SUPPRESS } from "./index";

export interface ParsingExpressionOptions {
  ruleName?: string;
  refiner?: RefinerFn | typeof SUPPRESS | number | number[];

  skipws?: string;
  eolterm?: boolean;
  ignoreCase?: boolean;
}

// Shouldn't apply for classes with autoReduce=true
export type ParseManyOptions = ParsingExpressionOptions & { sep?: GrammarDef };

export type MatchOptions = Omit<ParsingExpressionOptions, "skipws" | "eolterm">;
