import { ParsingExpression } from "./ParsingExpression";
import { GrammarDef } from "../../types";
import { PEOptions } from "../types";
import { ParserContext } from "../../parser";

/**
 * Conceptual wrapper for a grammar rule.
 * Used for wrapping function-defined rules, so cross-references are lazy-evaluated.
 *
 * This Rule doesn't appear in the parse tree. Its child element is promoted instead.
 *
 * **#auto_reducible**
 */
export class Expression extends ParsingExpression {
  constructor(
    readonly element: GrammarDef,
    readonly options: PEOptions = {},
  ) {
    super([element], options);
  }

  _parse(ctx: ParserContext) {
    return [ctx.getRule(this.element).parse(ctx)];
  }
}
