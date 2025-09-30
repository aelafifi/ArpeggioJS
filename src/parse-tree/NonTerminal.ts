import { Node } from "./types";
import {
  Choice,
  Expression,
  Match,
  Optional,
  ParsingExpression,
  SyntaxPredicate,
} from "../parsing-expression";
import { PTNode } from "./PTNode";

export class NonTerminal extends PTNode {
  constructor(
    rule: Exclude<ParsingExpression, Match | SyntaxPredicate>,
    public children: Node[],
    range: [number, number],
    pres: {
      ws?: string;
      comments?: Node[];
    } = {},
  ) {
    super(rule, range, pres);
  }

  get desc() {
    return this.name;
  }

  get _children(): null | Node | Node[] {
    const children = this.children.filter((c) => !c.rule.suppress);

    if (this.rule instanceof Choice || this.rule instanceof Expression) {
      return children[0]?.value;
    }

    if (children.length === 0) {
      return null;
    }

    if (this.rule instanceof Optional) {
      if (children.length > 0) {
        return children[0]?.value;
      }

      return null;
    }

    return children.map((c) => c.value);
  }

  get value(): any {
    if (this.rule.refiner) {
      return this.rule.refiner(this, this._children);
    }

    return this._children;
  }

  flatStr(preserveComments: boolean = true): string {
    return (
      this._originalCode ??
      this.commentsBefore
        .map((c) => (preserveComments ? c.flatStr(true) : c.wsBefore))
        .join() +
        this.wsBefore +
        this.children.map((c) => c.flatStr(preserveComments)).join("")
    );
  }

  hasContent(): boolean {
    return this.children.some((c) => c.hasContent());
  }

  treeStr(includeSuppressed: boolean = false, indent = 0): string {
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
