import { Sequence } from "./Sequence";
import { GrammarDef } from "../../types";
import { ParseManyOptions } from "../types";
import { ParserContext } from "../../parser";
import { NoMatch } from "../../errors";
import { ParsingExpression } from "./ParsingExpression";

export class UnorderedGroup extends ParsingExpression {
  constructor(
    elements: GrammarDef[],
    readonly options: ParseManyOptions = {},
  ) {
    super(elements, options);
  }

  _parse(ctx: ParserContext): any {
    const results = [];
    const c_pos = ctx.position;

    // Prefetching
    const nodes_to_try = this.elements.map((e) => ctx.getRule(e));
    let result;
    let sep_result;
    let first = true;
    let match = true;

    while (nodes_to_try) {
      let sep_exc;

      // Separator
      const c_loc_pos_sep = ctx.position;
      if (this.options.sep && !first) {
        try {
          sep_result = ctx.getRule(this.options.sep).parse(ctx);
        } catch (e) {
          if (e instanceof NoMatch) {
            ctx.position = c_loc_pos_sep; // Backtracking

            // This still might be valid if all remaining subexpressions
            // are optional and none of them will match
            sep_exc = e;
          } else {
            throw e;
          }
        }
      }

      const c_loc_pos = ctx.position;
      match = true;
      let all_optionals_fail = true;
      for (let i = 0; i < nodes_to_try.length; i++) {
        const e = nodes_to_try[i];

        try {
          result = e.parse(ctx);
          if (result.hasContent()) {
            if (sep_exc) {
              throw sep_exc;
            }
            if (sep_result) {
              results.push(sep_result);
            }
            first = false;
            match = true;
            all_optionals_fail = false;
            results.push(result);
            nodes_to_try.splice(i, 1);
            break;
          }
        } catch (e) {
          if (e instanceof NoMatch) {
            match = false;
            ctx.position = c_loc_pos; // local backtracking
          } else {
            throw e;
          }
        }
      }
      if (!match || all_optionals_fail) {
        // If sep is matched backtrack it
        ctx.position = c_loc_pos_sep;
        break;
      }
    }

    if (!match) {
      // Unsuccessful match of the whole PE - full backtracking
      ctx.position = c_pos;
      throw ctx.noMatch(this, c_pos);
    }

    return results;
  }
}
