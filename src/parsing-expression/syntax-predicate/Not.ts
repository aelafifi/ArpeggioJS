import { ParserContext } from "../../parser";
import { REMEMBER, withProps } from "prop-scope";
import { NoMatch } from "../../errors";

import { SyntaxPredicate } from "./SyntaxPredicate";

export class Not extends SyntaxPredicate {
  _parse(ctx: ParserContext) {
    return withProps(
      ctx as any,
      {
        position: REMEMBER,
        in_not: true,
      },
      (values) => {
        try {
          ctx.getRule(this.element).parse(ctx);
        } catch (e) {
          if (e instanceof NoMatch) {
            return null;
          }
          throw e;
        }

        throw ctx.noMatch(this, values.position);
      },
    );
  }
}
