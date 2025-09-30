import { PTNode } from "../parse-tree";
import { ParsingExpression } from "./basic";
import { AmbiguityError } from "../errors";
import { Parser } from "../parser";

export function autoReduce(
  parser: Parser,
  result: PTNode,
  wrapperRule: ParsingExpression,
): PTNode {
  if (result.rule.ruleName && wrapperRule.ruleName) {
    throw new AmbiguityError(
      `Rule name conflict for auto-reduced rule: '${result.rule.ruleName}' and '${wrapperRule.ruleName}'`,
    );
  }
  if (result.rule.refiner && wrapperRule.refiner) {
    throw new AmbiguityError(
      `Refiner conflict for auto-reduced rule: '${result.rule.refiner}' and '${wrapperRule.refiner}'`,
    );
  }

  if (wrapperRule.ruleName) {
    result.__ruleName = wrapperRule.ruleName;
  }

  if (wrapperRule.refiner) {
    result.__refiner = wrapperRule.refiner;
  }

  result.__suppress = wrapperRule.suppress || result.rule.suppress;

  return result;
}
