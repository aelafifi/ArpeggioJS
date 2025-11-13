import { ParserContext } from "../../parser";
import { Node, Terminal } from "../../parse-tree";

import { Match } from "./Match";
import { MatchOptions } from "../types";

/**
 * Class for matching exact string patterns in the input.
 */
export class StringMatch extends Match {
  constructor(
    readonly pattern: string,
    readonly options: MatchOptions = {},
  ) {
    super(pattern, options);
  }

  _parse(ctx: ParserContext): Node {
    const c_pos = ctx.position;
    const ignoreCase = this.ignoreCase ?? ctx.ignoreCase;

    const a = ignoreCase ? this.pattern.toLowerCase() : this.pattern;
    const part = ctx.input.slice(ctx.position, ctx.position + a.length);
    const b = ignoreCase ? part.toLowerCase() : part;
    if (a === b) {
      ctx.debug(
        `++ Match '${this.pattern}' ${ctx.atPosition(c_pos, a.length)}`,
      );
      ctx.position += a.length;
      return new Terminal(this, part, [c_pos, ctx.position]);
    }

    ctx.debug(`-- No match '${this.pattern}' ${ctx.atPosition(c_pos)}`);
    throw ctx.noMatch(this, c_pos);
  }
}
