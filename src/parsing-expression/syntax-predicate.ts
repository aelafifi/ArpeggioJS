import type { Parser } from "../parser";
import { CommentsParser, WhitespaceSkipper } from "../parser";
import { NoMatch } from "../errors";
import { GrammarDef } from "../types";
import { ParsingExpression, SUPPRESS } from "./index";
import { NonTerminal, PTNode } from "../parset-tree";

export abstract class SyntaxPredicate extends ParsingExpression {
  constructor(readonly element: GrammarDef) {
    super([], {
      refiner: SUPPRESS,
    });
  }

  _doParsing(parser: Parser): PTNode {
    const first_c_pos = parser.position;
    CommentsParser.parseComments(parser, this);
    WhitespaceSkipper.skipWhitespaces(parser, this);
    const c_pos = parser.position;

    try {
      this._parse(parser);
      return new NonTerminal(this, [], [c_pos, c_pos]);
    } finally {
      parser.position = first_c_pos;
    }
  }
}

export class And extends SyntaxPredicate {
  _parse(parser: Parser) {
    const c_pos = parser.position;
    const node = parser.getRule(this.element);

    try {
      node.parse(parser);
    } finally {
      parser.position = c_pos;
    }

    return null;
  }
}

export class Not extends SyntaxPredicate {
  _parse(parser: Parser) {
    const c_pos = parser.position;
    const node = parser.getRule(this.element);
    const old_in_not = parser.in_not;
    parser.in_not = true;

    try {
      node.parse(parser);
    } catch (e) {
      if (e instanceof NoMatch) {
        return null;
      }
      throw e;
    } finally {
      parser.position = c_pos;
      parser.in_not = old_in_not;
    }

    throw parser.noMatch(this, c_pos);
  }
}

export class Empty extends SyntaxPredicate {
  constructor() {
    super([]);
  }

  _parse(parser: Parser) {
    return null;
  }
}
