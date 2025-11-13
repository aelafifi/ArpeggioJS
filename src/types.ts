import type { ParsingExpression } from "./parsing-expression";

export type GrammarDef =
  | null // => Empty
  | string // => StrMatch | Keyword
  | String // => StrMatch | Keyword
  | RegExp // => RegExpMatch
  | ParsingExpression // as is
  | GrammarDef[] // => Sequence
  | (() => GrammarDef); // => Lazy evaluation

export interface ParserOptions {
  debug?: boolean;
  ignoreCase?: boolean;
  skipws?: string;
  eolterm?: boolean;
  commentsModel?: GrammarDef;
  autokwd?: boolean;
}
