import { GrammarDef } from "../types";
import { PTNode } from "../parse-tree";

export interface PEOptions {
  ruleName?: string;
  suppress?: boolean;
  refiner?: (node: PTNode) => any;

  lex?: boolean;
  skipws?: string;
  eolterm?: boolean;
  ignoreCase?: boolean;
}

export type AutoReducedPEOptions = Omit<PEOptions, "refiner">;

// Shouldn't apply for classes with autoReduce=true
export type ParseManyOptions = PEOptions & { sep?: GrammarDef };

export type MatchOptions = Omit<PEOptions, "skipws" | "eolterm" | "lex">;
