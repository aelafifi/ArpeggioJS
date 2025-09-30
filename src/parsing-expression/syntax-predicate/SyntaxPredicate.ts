import { GrammarDef } from "../../types";
import { ParserContext } from "../../parser";
import { Node, Terminal } from "../../parse-tree";
import { REMEMBER, withProps } from "prop-scope";
import { ParsingExpression } from "../basic/ParsingExpression";

export abstract class SyntaxPredicate extends ParsingExpression {
  constructor(readonly element: GrammarDef) {
    super([], {
      suppress: true,
    });
  }

  _doParsing(ctx: ParserContext): Node {
    return withProps(ctx as any, { position: REMEMBER }, () => {
      ctx.parseComments();
      ctx.skipWhitespaces();
      const c_pos = ctx.position;

      this._parse(ctx);
      return new Terminal(this, "", [c_pos, c_pos]);
      // return new NonTerminal(this, [], [c_pos, c_pos]);
    });
  }
}
