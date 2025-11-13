import { ParseManyOptions } from "../index";
import type { GrammarDef } from "../../types";
import { ParserContext } from "../../parser";
import type { Node } from "../../parse-tree";
import { NoMatch } from "../../errors";
import { ParsingExpression } from "../basic";

export class Repetition extends ParsingExpression {
  constructor(
    readonly element: GrammarDef,
    readonly options: ParseManyOptions & { min: number; max: number },
  ) {
    if (options.min < 0 || options.max < options.min) {
      throw new Error(`Invalid min/max values: ${options.min}/${options.max}`);
    }
    if (Number.isFinite(options.min) && !Number.isInteger(options.min)) {
      throw new Error(`Invalid min value: ${options.min}`);
    }
    if (Number.isFinite(options.max) && !Number.isInteger(options.max)) {
      throw new Error(`Invalid max value: ${options.max}`);
    }
    super([element], options);
  }

  _parse(ctx: ParserContext): Node | Node[] | null {
    const results: Node[] = [];
    let c_pos = ctx.position;
    const rule = ctx.getRule(this.element);
    const sep = this.options.sep ? ctx.getRule(this.options.sep) : null;
    let found = 0;

    while (found < this.options.max) {
      try {
        c_pos = ctx.position;
        if (sep && found > 0) {
          results.push(sep.parse(ctx));
        }
        const result = rule.parse(ctx);
        results.push(result);
        found++;

        // If we have found at least the minimum required, and the last parse did not consume any input,
        // stop here to avoid unnecessary iterations (if max is set to a high number or Infinity).
        if (found >= this.options.min && !result.hasContent()) {
          break;
        }
      } catch (e) {
        if (e instanceof NoMatch) {
          ctx.position = c_pos;
          if (found >= this.options.min) {
            break;
          }
        }
        throw e;
      }
    }

    return results;
  }
}
