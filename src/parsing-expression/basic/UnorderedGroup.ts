import { Sequence } from "./Sequence";
import { GrammarDef } from "../../types";
import { ParseManyOptions } from "../types";
import { Parser } from "../../parser";

export class UnorderedGroup extends Sequence {
  constructor(elements: GrammarDef[], options: ParseManyOptions = {}) {
    super(elements, options);
    throw new Error("UnorderedGroup expression is not implemented.");
  }

  _parse(parser: Parser): any {
    // TODO: implement
    throw new Error("Method is not implemented.");
  }
}
