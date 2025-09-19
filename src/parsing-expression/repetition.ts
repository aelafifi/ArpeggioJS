import { GrammarDef } from "../types";
import type { Parser } from "../parser";
import { PTNode } from "../parset-tree";
import { NoMatch } from "../errors";
import { ParsingExpression } from "./index";
import { ParsingExpressionOptions, ParseManyOptions } from "./options";

export class Repetition extends ParsingExpression {
  constructor(
    readonly element: GrammarDef,
    readonly min: number,
    readonly max: number,
    readonly options: ParseManyOptions = {},
  ) {
    super([element], options);
  }

  _parse(parser: Parser) {
    const results: PTNode[] = [];
    let c_pos = parser.position;
    const rule = parser.getRule(this.element);
    const sep = this.options.sep ? parser.getRule(this.options.sep) : null;
    let found = 0;

    while (found < this.max) {
      try {
        c_pos = parser.position;
        if (sep && found > 0) {
          results.push(sep.parse(parser));
        }
        const result = rule.parse(parser);
        results.push(result);
        found++;

        if (found >= this.min && result._value === null) {
          break;
        }
      } catch (e) {
        if (e instanceof NoMatch) {
          parser.position = c_pos;
          if (found >= this.min) {
            break;
          }
        }
        throw e;
      }
    }

    return results;
  }
}

export class ZeroOrMore extends Repetition {
  constructor(element: GrammarDef, options: ParseManyOptions = {}) {
    super(element, 0, Infinity, options);
  }
}

export class OneOrMore extends Repetition {
  constructor(element: GrammarDef, options: ParseManyOptions = {}) {
    super(element, 1, Infinity, options);
  }
}

export class Optional extends Repetition {
  readonly shouldReduce = true;

  constructor(element: GrammarDef, options: ParsingExpressionOptions = {}) {
    super(element, 0, 1, options);
  }
}
