import { ParsingExpression } from "./ParsingExpression";
import { GrammarDef } from "../../types";
import { ParseManyOptions } from "../types";
import { ParserContext } from "../../parser";
import { Node } from "../../parse-tree";
import { NoMatch } from "../../errors";

export class Sequence extends ParsingExpression {
  constructor(
    elements: GrammarDef[],
    readonly options: ParseManyOptions = {},
  ) {
    super(elements, options);
  }

  _parse(ctx: ParserContext): Node[] {
    const results: Node[] = [];
    const c_pos = ctx.position;
    const sep = this.options.sep ? ctx.getRule(this.options.sep) : null;
    for (const element of this.elements) {
      const node = ctx.getRule(element);
      try {
        if (sep && results.length > 0) {
          results.push(sep.parse(ctx));
        }
        results.push(node.parse(ctx));
      } catch (e) {
        if (e instanceof NoMatch) {
          ctx.position = c_pos;
        }
        throw e;
      }
    }
    return results;
  }
}
