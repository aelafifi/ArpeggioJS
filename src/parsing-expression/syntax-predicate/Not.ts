import type { Parser } from "../../parser";
import { REMEMBER, withProps } from "prop-scope";
import { NoMatch } from "../../errors";

import { SyntaxPredicate } from "./SyntaxPredicate";

export class Not extends SyntaxPredicate {
  _parse(parser: Parser) {
    return withProps(
      parser as any,
      {
        position: REMEMBER,
        in_not: true,
      },
      (values) => {
        try {
          parser.getRule(this.element).parse(parser);
        } catch (e) {
          if (e instanceof NoMatch) {
            return null;
          }
          throw e;
        }

        throw parser.noMatch(this, values.position);
      },
    );
  }
}
