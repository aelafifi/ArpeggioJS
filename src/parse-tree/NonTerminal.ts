import { ParsingExpression, SUPPRESS } from "../parsing-expression";

import { PTNode } from "./PTNode";
import { getRefinerFunction } from "./utils";

export class NonTerminal extends PTNode {
  constructor(
    rule: ParsingExpression,
    public children: PTNode[],
    range: [number, number],
    pres: {
      ws?: string;
      comments?: PTNode[];
    } = {},
  ) {
    super(rule, range, pres);
  }

  get desc() {
    return this.name;
  }

  get flatStr(): string {
    return (
      this._originalCode ??
      this.commentsBefore.map((c) => c.flatStr).join() +
        this.wsBefore +
        this.children.map((c) => c.flatStr).join("")
    );
  }

  get isSuppressed() {
    return (
      this.rule.refiner === SUPPRESS ||
      (this.children.length > 0 && this.children.every((c) => c.isSuppressed))
    );
  }

  get _value() {
    if (this.isSuppressed) {
      return null;
    }

    const refinedChildren = this.children
      .filter((c) => c.rule.refiner !== SUPPRESS)
      .map((c) => c.refined);

    if (
      this.rule.shouldReduce ||
      (this.rule.couldReduce && this.rule.elements.length === 1)
    ) {
      switch (refinedChildren.length) {
        case 0:
          return null;
        case 1:
          return refinedChildren[0];
      }
    }

    return refinedChildren;
  }

  get refined(): any {
    if (this.isSuppressed) {
      return null;
    }

    const refiner = getRefinerFunction(this.rule.refiner) as Function;

    const refinedChildren = this.children
      .filter((c) => c.rule.refiner !== SUPPRESS)
      .map((c) => c.refined);

    if (
      this.rule.shouldReduce ||
      (this.rule.couldReduce && this.rule.elements.length === 1)
    ) {
      switch (refinedChildren.length) {
        case 0:
          return refiner(null);
        case 1:
          return refiner(refinedChildren[0]);
      }
    }

    return refiner(refinedChildren);
  }

  treeStr(indent = 0) {
    const children =
      this.children.map((c) => c.treeStr(indent + 1)).join("\n") ||
      "  ".repeat(indent + 1) + "N/A";
    return `${super.treeStr(indent)}\n${children}`;
  }

  toJSON() {
    return {
      start: this.start,
      end: this.end,
      children: this.children,
    };
  }
}
