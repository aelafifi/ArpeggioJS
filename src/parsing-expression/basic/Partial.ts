import { Sequence } from "./Sequence";
import { GrammarDef } from "../../types";
import { ParseManyOptions } from "../types";
import { ParserContext } from "../../parser";
import type { Node } from "../../parse-tree";
import { NoMatch } from "../../errors";

export class Partial extends Sequence {
  constructor(elements: GrammarDef[], options: ParseManyOptions = {}) {
    super(elements, options);
  }

  _parse(ctx: ParserContext): Node[] {
    const results: Node[] = [];
    let c_pos: number;
    const sep = this.options.sep ? ctx.getRule(this.options.sep) : null;
    for (const element of this.elements) {
      c_pos = ctx.position;
      const node = ctx.getRule(element);
      try {
        if (sep && results.length > 0) {
          results.push(sep.parse(ctx));
        }
        results.push(node.parse(ctx));
      } catch (e) {
        if (e instanceof NoMatch) {
          ctx.position = c_pos;
          break;
        }
        throw e;
      }
    }
    return results;
  }
}
