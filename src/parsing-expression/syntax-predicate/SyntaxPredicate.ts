import { GrammarDef } from "../../types";
import type { Parser } from "../../parser";
import { CommentsParser, WhitespaceSkipper } from "../../parser";
import { Node, Terminal } from "../../parse-tree";
import { REMEMBER, withProps } from "prop-scope";
import { ParsingExpression } from "../basic/ParsingExpression";

export abstract class SyntaxPredicate extends ParsingExpression {
  constructor(readonly element: GrammarDef) {
    super([], {
      suppress: true,
    });
  }

  _doParsing(parser: Parser): Node {
    return withProps(parser as any, { position: REMEMBER }, () => {
      CommentsParser.parseComments(parser);
      WhitespaceSkipper.skipWhitespaces(parser);
      const c_pos = parser.position;

      this._parse(parser);
      return new Terminal(this, "", [c_pos, c_pos]);
      // return new NonTerminal(this, [], [c_pos, c_pos]);
    });
  }
}
