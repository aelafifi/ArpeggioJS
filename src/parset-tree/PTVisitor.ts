import { PTNode } from "./PTNode";
import { Terminal } from "./Terminal";
import { NonTerminal } from "./NonTerminal";
import { ParsingExpression } from "../parsing-expression";
import { getRefinerFunction } from "./utils";

export class PTVisitor {
  constructor(
    readonly pt: PTNode,
    rules: Record<string, Function> = {},
  ) {
    Object.assign(this as any, rules);
  }

  visit() {
    return this._visit(this.pt);
  }

  private _visit(node: PTNode, parent?: PTNode) {
    this._visitBefore(node, parent);
    return this._visitAfter(node);
  }

  private _getVisitorFn(
    prefix: string,
    rule: ParsingExpression,
  ): Function | null {
    const key1 = `${prefix}${rule.ruleName}`;
    if (
      this.hasOwnProperty(key1) &&
      typeof this[key1 as keyof typeof this] === "function"
    ) {
      return this[key1 as keyof typeof this] as Function;
    }

    const key2 = `${prefix}${rule.constructor.name}`;
    if (
      this.hasOwnProperty(key2) &&
      typeof this[key2 as keyof typeof this] === "function"
    ) {
      return this[key2 as keyof typeof this] as Function;
    }

    return null;
  }

  private _visitBefore(node: PTNode, parent?: PTNode): void {
    const fn = this._getVisitorFn("before", node.rule);
    if (fn !== null) {
      fn.call(this, node, parent);
    }
  }

  private _visitAfter(node: PTNode): any {
    if (node.isSuppressed) {
      return null;
    }

    let value: any;

    if (node instanceof Terminal) {
      value = node.value;
    }

    if (node instanceof NonTerminal) {
      value = node.children
        .filter((c) => !c.isSuppressed)
        .map((c) => this._visit(c, node));
    }

    const fn =
      this._getVisitorFn("after", node.rule) ??
      ((node: PTNode, value: any) =>
        (getRefinerFunction(node.rule.refiner) as Function)(value));

    if (node instanceof NonTerminal && node.rule.shouldReduce) {
      switch (value.length) {
        case 0:
          return fn.call(this, node, null);
        case 1:
          return fn.call(this, node, value[0]);
      }
    }

    if (node instanceof NonTerminal && node.rule.couldReduce) {
      switch (node.rule.elements.length) {
        case 0:
          return fn.call(this, node, null);
        case 1:
          return fn.call(this, node, value[0]);
      }
    }

    return fn.call(this, node, value);
  }
}
