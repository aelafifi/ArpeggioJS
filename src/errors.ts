import { Parser, ParserContext } from "./parser";

import { ParsingExpression } from "./parsing-expression";

export class GrammarError extends Error {}

export class AmbiguityError extends Error {}

export class NoMatch extends Error {
  constructor(
    public rules: ParsingExpression[],
    public position: number,
    public ctx: ParserContext,
  ) {
    const message = rules.length
      ? `Expected ${[...new Set(rules.map((r) => r.name))].join(" or ")}`
      : "Not expected input";

    super(`${message} ${ctx.atPosition(position)}'`);
  }
}
