import {
  OneOrMore as _OneOrMore,
  Optional as _Optional,
  ParseManyOptions,
  PEOptions,
  ZeroOrMore as _ZeroOrMore,
  Sequence as _Sequence,
  Choice as _Choice,
} from "./parsing-expression";
import { GrammarDef } from "./types";

export const Sequence = (elements: GrammarDef[], options: ParseManyOptions) =>
  new _Sequence(elements, options);

export const Choice = (elements: GrammarDef[], options?: PEOptions) =>
  new _Choice(elements, options);

export const OneOrMore = (element: GrammarDef, options?: ParseManyOptions) =>
  new _OneOrMore(element, options);

export const ZeroOrMore = (element: GrammarDef, options?: ParseManyOptions) =>
  new _ZeroOrMore(element, options);

export const Optional = (element: GrammarDef, options?: PEOptions) =>
  new _Optional(element, options);
