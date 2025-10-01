import { Node } from "./types";
import {
  Choice,
  Expression,
  Match,
  Optional,
  ParsingExpression,
  Sequence,
  SyntaxPredicate,
  VisitorFn,
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
    const children = this.children.filter((c) => !c.suppressed);

    if (
      this.rule instanceof Choice ||
      this.rule instanceof Optional ||
      this.rule instanceof Expression
    ) {
      return children[0]?.value ?? null;
    }

    if (children.length === 0) {
      return null;
    }

    if (children.length === 1 && this.rule instanceof Sequence) {
      return children[0]?.value;
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

  visit(visitors: Record<string, VisitorFn> = {}): any {
    if (this.rule.refiner) {
      return this.value;
    }

    const visitor =
      visitors[this.rule.ruleName] ?? ((_node: Node, value: any) => value);

    const childrenValues = this.children
      .filter((c) => !c.suppressed)
      .map((child) => child.visit(visitors));

    if (
      this.rule instanceof Choice ||
      this.rule instanceof Optional ||
      this.rule instanceof Optional ||
      this.rule instanceof Expression
    ) {
      return visitor(this, childrenValues[0] ?? null);
    }

    if (childrenValues.length === 0) {
      return visitor(this, null);
    }

    if (childrenValues.length === 1 && this.rule instanceof Sequence) {
      return visitor(this, childrenValues[0]);
    }

    return visitor(this, childrenValues);
  }

  get suppressed(): boolean {
    if (this.rule.suppress) {
      return true;
    }

    const value = this.value;
    if (value instanceof ParsingExpression && value.suppress) {
      return true;
    }

    return false;
  }
}
