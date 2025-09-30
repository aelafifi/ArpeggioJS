import { ParserContext } from "../../parser";
import { Node, Terminal } from "../../parse-tree";

import { Match } from "./Match";
import { MatchOptions } from "../types";

export class RegexMatch extends Match {
  constructor(
    readonly pattern: RegExp,
    readonly options: MatchOptions = {},
  ) {
    super(pattern, options);
  }

  getRegex(ctx: ParserContext) {
    const ignoreCase = this.ignoreCase ?? ctx.ignoreCase;
    if (ignoreCase === true && !this.pattern.ignoreCase) {
      const flags = this.pattern.flags + "i";
      return new RegExp(this.pattern.source, flags);
    }
    return this.pattern;
  }

  _parse(ctx: ParserContext): Node {
    const c_pos = ctx.position;
    const regex = this.getRegex(ctx);
    const part = ctx.input.slice(ctx.position);
    const match = part.match(regex);

    if (match === null || match.index !== 0) {
      ctx.debug(`-- No match ${this.pattern} ${ctx.atPosition(c_pos)}`);
      throw ctx.noMatch(this, c_pos);
    }

    ctx.debug(`++ Match ${regex} ${ctx.atPosition(c_pos, match[0].length)}`);
    ctx.position += match[0].length;
    return new Terminal(this, match[0], [c_pos, c_pos + match[0].length]);
  }
}
