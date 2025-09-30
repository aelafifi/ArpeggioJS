import { ParsingExpression } from "./ParsingExpression";
import { GrammarDef } from "../../types";
import { AutoReducedPEOptions, PEOptions } from "../types";
import { Parser } from "../../parser";
import { NoMatch } from "../../errors";
import { PTNode } from "../../parse-tree";

/**
 * **#auto_reducible**
 */
export class Choice extends ParsingExpression {
  constructor(elements: GrammarDef[], options: PEOptions = {}) {
    super(elements, options);
  }

  _parse(parser: Parser) {
    const c_pos = parser.position;
    let emptyMatch: PTNode | undefined;
    for (const element of this.elements) {
      const node = parser.getRule(element);
      try {
        const result = node.parse(parser);
        if (!result.hasContent()) {
          emptyMatch ??= result;
          continue;
        }
        return [result];
      } catch (e) {
        if (e instanceof NoMatch) {
          parser.position = c_pos;
        } else {
          throw e;
        }
      }
    }

    if (emptyMatch) {
      return [emptyMatch];
    }

    throw parser.noMatch(this, c_pos);
  }
}
