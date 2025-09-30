import { GrammarDef } from "../types";
import { Node } from "../parse-tree";

export type VisitorFn = (node: Node, value: any) => any;

export interface PEOptions {
  ruleName?: string;
  suppress?: boolean;
  refiner?: VisitorFn;

  lex?: boolean;
  skipws?: string;
  eolterm?: boolean;
  ignoreCase?: boolean;
}

export interface WithSep {
  sep?: GrammarDef;
}

export type ParseManyOptions = PEOptions & WithSep;

export type MatchOptions = Omit<PEOptions, "skipws" | "eolterm" | "lex">;
