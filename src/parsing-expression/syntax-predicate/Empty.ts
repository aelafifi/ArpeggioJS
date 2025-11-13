import { ParserContext } from "../../parser";

import { SyntaxPredicate } from "./SyntaxPredicate";

class Empty extends SyntaxPredicate {
  constructor() {
    super([]);
  }

  _parse(ctx: ParserContext) {
    return null;
  }
}

export const Epsilon = new Empty();
