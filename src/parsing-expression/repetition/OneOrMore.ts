import type { GrammarDef } from "../../types";
import type { ParseManyOptions } from "../types";

import { Repetition } from "./Repetition";

export class OneOrMore extends Repetition {
  constructor(element: GrammarDef, options: ParseManyOptions = {}) {
    super(element, { ...options, min: 1, max: Infinity });
  }
}
