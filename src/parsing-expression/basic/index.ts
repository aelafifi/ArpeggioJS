import { GrammarDef } from "../../types";
import { Sequence } from "./Sequence";
import { ParseManyOptions, PEOptions } from "../types";
import { Choice } from "./Choice";
import { Partial } from "./Partial";
import { Expression } from "./Expression";
import { UnorderedGroup } from "./UnorderedGroup";

export function sequence(elements: GrammarDef[], options?: ParseManyOptions) {
  return new Sequence(elements, options);
}

export function choice(elements: GrammarDef[], options?: PEOptions) {
  return new Choice(elements, options);
}

export function partial(elements: GrammarDef[], options?: ParseManyOptions) {
  return new Partial(elements, options);
}

export function unorderedGroup(
  elements: GrammarDef[],
  options?: ParseManyOptions,
) {
  return new UnorderedGroup(elements, options);
}

export function expression(element: GrammarDef, options?: PEOptions) {
  return new Expression(element, options);
}

export { ParsingExpression } from "./ParsingExpression";
export { Expression } from "./Expression";
// export { UnorderedGroup } from "./UnorderedGroup";
export { Sequence, Choice, Partial };
