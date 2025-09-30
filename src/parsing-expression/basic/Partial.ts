import { Sequence } from "./Sequence";
import { GrammarDef } from "../../types";
import { ParseManyOptions } from "../types";
import { Parser } from "../../parser";
import type { Node } from "../../parse-tree";
import { NoMatch } from "../../errors";

export class Partial extends Sequence {
  constructor(elements: GrammarDef[], options: ParseManyOptions = {}) {
    super(elements, options);
  }

  _parse(parser: Parser): Node[] {
    const results: Node[] = [];
    let c_pos: number;
    const sep = this.options.sep ? parser.getRule(this.options.sep) : null;
    for (const element of this.elements) {
      c_pos = parser.position;
      const node = parser.getRule(element);
      try {
        if (sep && results.length > 0) {
          results.push(sep.parse(parser));
        }
        results.push(node.parse(parser));
      } catch (e) {
        if (e instanceof NoMatch) {
          parser.position = c_pos;
          break;
        }
        throw e;
      }
    }
    return results;
  }
}
