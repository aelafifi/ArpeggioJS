import { Parser } from "../../parser";
import { PTNode, Terminal } from "../../parse-tree";

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

  _parse(parser: Parser): PTNode {
    const c_pos = parser.position;
    const ignoreCase = this.ignoreCase ?? parser.ignoreCase;

    const a = ignoreCase ? this.pattern.toLowerCase() : this.pattern;
    const part = parser.input.slice(
      parser.position,
      parser.position + a.length,
    );
    const b = ignoreCase ? part.toLowerCase() : part;
    if (a === b) {
      parser.debug(
        `++ Match '${this.pattern}' ${parser.atPosition(c_pos, a.length)}`,
      );
      parser.position += a.length;
      return new Terminal(this, part, [c_pos, parser.position]);
    }

    parser.debug(`-- No match '${this.pattern}' ${parser.atPosition(c_pos)}`);
    throw parser.noMatch(this, c_pos);
  }
}
