import { PTNode } from "./PTNode";
import { Match, SyntaxPredicate, VisitorFn } from "../parsing-expression";
import { Node } from "./types";

export class Terminal extends PTNode {
  constructor(
    rule: Match | SyntaxPredicate,
    public rawValue: string,
    range: [number, number],
    pres: {
      ws?: string;
      comments?: Node[];
    } = {},
  ) {
    super(rule, range, pres);
  }

  get desc() {
    return this.rawValue
      ? `${this.rule.name} '${this.rawValue}' [${this.start}:${this.end}]`
      : this.name;
  }

  get value(): string {
    if (this.rule.refiner) {
      return this.rule.refiner(this, this.rawValue);
    }

    return this.rawValue;
  }

  flatStr(preserveComments: boolean = true): string {
    return (
      this._originalCode ??
      this.commentsBefore
        .map((c) => (preserveComments ? c.flatStr(true) : c.wsBefore))
        .join() +
        this.wsBefore +
        this.rawValue
    );
  }

  treeStr(includeSuppressed: boolean = false, indent = 0): string {
    return `${super.treeStr(includeSuppressed, indent)}: "${this.rawValue}"`;
  }

  hasContent(): boolean {
    return this.rawValue !== "";
  }

  toJSON() {
    return {
      start: this.start,
      end: this.end,
      rawValue: this.rawValue,
    };
  }

  visit(visitors: Record<string, VisitorFn> = {}): any {
    if (this.rule.refiner) {
      return this.value;
    }

    const visitor =
      visitors[this.rule.ruleName] ?? ((_node: Node, value: any) => value);

    return visitor(this, this.value);
  }

  get suppressed(): boolean {
    return this.rule.suppress;
  }
}
