import { ParsingExpression } from "./ParsingExpression";
import { GrammarDef } from "../../types";
import { ParseManyOptions } from "../types";
import { Parser } from "../../parser";
import { Node } from "../../parse-tree";
import { NoMatch } from "../../errors";

export class Sequence extends ParsingExpression {
  constructor(
    elements: GrammarDef[],
    readonly options: ParseManyOptions = {},
  ) {
    super(elements, options);
  }

  _parse(parser: Parser): Node[] {
    const results: Node[] = [];
    const c_pos = parser.position;
    const sep = this.options.sep ? parser.getRule(this.options.sep) : null;
    for (const element of this.elements) {
      const node = parser.getRule(element);
      try {
        if (sep && results.length > 0) {
          results.push(sep.parse(parser));
        }
        results.push(node.parse(parser));
      } catch (e) {
        if (e instanceof NoMatch) {
          parser.position = c_pos;
        }
        throw e;
      }
    }
    return results;
  }
}
