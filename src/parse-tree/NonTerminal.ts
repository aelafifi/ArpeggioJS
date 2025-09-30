import { PTNode } from "./PTNode";
import {
  ParsingExpression,
  Match,
  SyntaxPredicate,
} from "../parsing-expression";

export class NonTerminal extends PTNode {
  constructor(
    rule: Exclude<ParsingExpression, Match | SyntaxPredicate>,
    public children: PTNode[],
    range: [number, number],
    _ruleName?: string,
    pres: {
      ws?: string;
      comments?: PTNode[];
    } = {},
  ) {
    super(rule, range, _ruleName, pres);
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

  hasContent(): boolean {
    return this.children.some((c) => c.hasContent());
  }

  treeStr(includeSuppressed: boolean = false, indent = 0) {
    const children = this.children
      .filter((c) => !c.rule.suppress || includeSuppressed)
      .map((c) => c.treeStr(includeSuppressed, indent + 1))
      .join("\n");
    return `${super.treeStr(includeSuppressed, indent)}${children ? "\n" + children : " —> ø"}`;
  }

  toJSON() {
    return {
      start: this.start,
      end: this.end,
      children: this.children,
    };
  }
}
