import { Optional } from "./Optional";
import { ParseManyOptions, PEOptions } from "../types";
import { GrammarDef } from "../../types";
import { ZeroOrMore } from "./ZeroOrMore";
import { OneOrMore } from "./OneOrMore";
import { Repetition } from "./Repetition";

export function repetition(
  element: GrammarDef,
  options: ParseManyOptions & { min: number; max: number },
) {
  return new Repetition(element, options);
}

export function optional(element: GrammarDef, options?: PEOptions) {
  return new Optional(element, options);
}

export function zeroOrMore(element: GrammarDef, options?: ParseManyOptions) {
  return new ZeroOrMore(element, options);
}

export function oneOrMore(element: GrammarDef, options?: ParseManyOptions) {
  return new OneOrMore(element, options);
}

export { Repetition, Optional, ZeroOrMore, OneOrMore };
