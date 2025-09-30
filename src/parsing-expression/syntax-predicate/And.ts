import type { Parser } from "../../parser";
import { REMEMBER, withProps } from "prop-scope";

import { SyntaxPredicate } from "./SyntaxPredicate";

export class And extends SyntaxPredicate {
  _parse(parser: Parser) {
    withProps(parser as any, { position: REMEMBER }, () =>
      parser.getRule(this.element).parse(parser),
    );

    return null;
  }
}
