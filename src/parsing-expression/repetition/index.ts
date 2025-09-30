import { Optional } from "./Optional";
import { ParseManyOptions, PEOptions } from "../types";
import { GrammarDef } from "../../types";
import { ZeroOrMore } from "./ZeroOrMore";
import { OneOrMore } from "./OneOrMore";

export function optional(element: GrammarDef, options?: PEOptions) {
  return new Optional(element, options);
}

export function zeroOrMore(element: GrammarDef, options?: ParseManyOptions) {
  return new ZeroOrMore(element, options);
}

export function oneOrMore(element: GrammarDef, options?: ParseManyOptions) {
  return new OneOrMore(element, options);
}

export { Repetition } from "./Repetition";
export { Optional, ZeroOrMore, OneOrMore };
