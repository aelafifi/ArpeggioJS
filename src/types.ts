import { ParsingExpression } from "./parsing-expression";

export const DEFAULT_WS = "\t\r\n ";
export const NOMATCH_MARKER = 0;

export const DEFAULT_KEYWORD_REGEX = /^[^\d\W]\w*$/;

export type GrammarDef =
  | null // => Empty
  | string // => StrMatch | Keyword
  | String // => StrMatch | Keyword
  | RegExp // => RegExpMatch
  | ParsingExpression // as is
  | GrammarDef[] // => Sequence
  | (() => GrammarDef); // => Lazy evaluation

export type RefinerFn = (value: any) => any;
