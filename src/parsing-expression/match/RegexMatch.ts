import { Parser } from "../../parser";
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

  getRegex(parser: Parser) {
    const ignoreCase = this.ignoreCase ?? parser.ignoreCase;
    if (ignoreCase === true && !this.pattern.ignoreCase) {
      const flags = this.pattern.flags + "i";
      return new RegExp(this.pattern.source, flags);
    }
    return this.pattern;
  }

  _parse(parser: Parser): Node {
    const c_pos = parser.position;
    const regex = this.getRegex(parser);
    const part = parser.input.slice(parser.position);
    const match = part.match(regex);

    if (match === null || match.index !== 0) {
      parser.debug(`-- No match ${this.pattern} ${parser.atPosition(c_pos)}`);
      throw parser.noMatch(this, c_pos);
    }

    parser.debug(
      `++ Match ${regex} ${parser.atPosition(c_pos, match[0].length)}`,
    );
    parser.position += match[0].length;
    return new Terminal(this, match[0], [c_pos, c_pos + match[0].length]);
  }
}
