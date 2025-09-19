import { Parser } from "./parser";
import { ParsingExpression } from "./parsing-expression";

export class GrammarError extends Error {}

export class NoMatch extends Error {
  constructor(
    public rules: ParsingExpression[],
    public position: number,
    public parser: Parser,
  ) {
    const message = rules.length
      ? `Expected ${[...new Set(rules.map((r) => r.name))].join(" or ")}`
      : "Not expected input";

    super(`${message} ${parser.atPosition(position)}'`);
  }
}
