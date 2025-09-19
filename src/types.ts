import { ParsingExpression } from "./parsing-expression";
import { PTNode } from "./parset-tree";

export const DEFAULT_WS = "\t\r\n ";
export const NOMATCH_MARKER = 0;

export const DEFAULT_KEYWORD_REGEX = /^[^\d\W]\w*$/;

export type expr =
  | null
  | string
  | String
  | RegExp
  | ParsingExpression
  | expr[]
  | (() => expr);

export type RefinerFn = (value: any) => any;
