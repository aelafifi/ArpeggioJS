import { And } from "./And";
import { GrammarDef } from "../../types";
import { Not } from "./Not";

export function and(element: GrammarDef) {
  return new And(element);
}

export function not(element: GrammarDef) {
  return new Not(element);
}

export { SyntaxPredicate } from "./SyntaxPredicate";
export { Epsilon } from "./Empty";
export { And, Not };
