import { ParsingExpression } from "./ParsingExpression";
import { GrammarDef } from "../../types";
import { PEOptions } from "../types";
import { ParserContext } from "../../parser";
import { NoMatch } from "../../errors";
import type { Node } from "../../parse-tree";

/**
 * **#auto_reducible**
 */
export class Choice extends ParsingExpression {
  constructor(elements: GrammarDef[], options: PEOptions = {}) {
    super(elements, options);
  }

  _parse(ctx: ParserContext) {
    const c_pos = ctx.position;
    let emptyMatch: Node | undefined;
    for (const element of this.elements) {
      const node = ctx.getRule(element);
      try {
        const result = node.parse(ctx);
        if (!result.hasContent()) {
          emptyMatch ??= result;
          continue;
        }
        return [result];
      } catch (e) {
        if (e instanceof NoMatch) {
          ctx.position = c_pos;
        } else {
          throw e;
        }
      }
    }

    if (emptyMatch) {
      return [emptyMatch];
    }

    throw ctx.noMatch(this, c_pos);
  }
}
