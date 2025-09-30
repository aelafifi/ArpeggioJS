import { MatchOptions } from "../index";
import { ParserContext } from "../../parser";
import type { Node } from "../../parse-tree";
import { withProps } from "prop-scope";
import { ParsingExpression } from "../basic/ParsingExpression";

/**
 * Base class for matching terminals (tokens) in the input.
 */
export abstract class Match extends ParsingExpression {
  ignoreCase?: boolean;

  constructor(
    readonly pattern: string | RegExp,
    readonly options: MatchOptions = {},
  ) {
    super([pattern], options);
    this.ignoreCase = options.ignoreCase;
  }

  get name() {
    const prefix = this.ruleName ? `${this.ruleName}=` : "";
    return `${prefix}${this.constructor.name}(${this.pattern})`;
  }

  parse(ctx: ParserContext): Node {
    return withProps(ctx, { in_match: true }, () => super.parse(ctx));
  }
}
