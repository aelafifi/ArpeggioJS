import { ParserContext } from "../../parser";
import { REMEMBER, withProps } from "prop-scope";

import { SyntaxPredicate } from "./SyntaxPredicate";

export class And extends SyntaxPredicate {
  _parse(ctx: ParserContext) {
    withProps(ctx as any, { position: REMEMBER }, () =>
      ctx.getRule(this.element).parse(ctx),
    );

    return null;
  }
}
