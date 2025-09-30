import { GrammarDef } from "../../types";
import { Sequence } from "./Sequence";
import { ParseManyOptions, PEOptions } from "../types";
import { Choice } from "./Choice";
import { Partial } from "./Partial";

export function sequence(elements: GrammarDef[], options?: ParseManyOptions) {
  return new Sequence(elements, options);
}

export function choice(elements: GrammarDef[], options?: PEOptions) {
  return new Choice(elements, options);
}

export function partial(elements: GrammarDef[], options?: ParseManyOptions) {
  return new Partial(elements, options);
}

export { ParsingExpression } from "./ParsingExpression";
export { Expression } from "./Expression";
// export { UnorderedGroup } from "./UnorderedGroup";
export { Sequence, Choice, Partial };
