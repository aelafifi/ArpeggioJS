import type { GrammarDef } from "../../types";
import type { ParseManyOptions } from "../types";

import { Repetition } from "./Repetition";

export class ZeroOrMore extends Repetition {
  constructor(element: GrammarDef, options: ParseManyOptions = {}) {
    super(element, { ...options, min: 0, max: Infinity });
  }
}
