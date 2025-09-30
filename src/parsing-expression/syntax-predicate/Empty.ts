import type { Parser } from "../../parser";

import { SyntaxPredicate } from "./SyntaxPredicate";

class Empty extends SyntaxPredicate {
  constructor() {
    super([]);
  }

  _parse(parser: Parser) {
    return null;
  }
}

export const Epsilon = new Empty();
