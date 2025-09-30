import type { ParsingExpression } from "./parsing-expression";

export type GrammarDef =
  | null // => Empty
  | string // => StrMatch | Keyword
  | String // => StrMatch | Keyword
  | RegExp // => RegExpMatch
  | ParsingExpression // as is
  | GrammarDef[] // => Sequence
  | (() => GrammarDef); // => Lazy evaluation

export type RefinerFn = (value: any) => any;
