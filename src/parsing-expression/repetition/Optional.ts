import type { GrammarDef } from "../../types";
import { PEOptions } from "../types";

import { Repetition } from "./Repetition";

export class Optional extends Repetition {
  constructor(element: GrammarDef, options: PEOptions = {}) {
    super(element, { ...options, min: 0, max: 1 });
  }
}
