import { ParsingExpression, VisitorFn } from "../parsing-expression";

export abstract class PTNode {
  rule: ParsingExpression;
  start: number;
  end: number;
  wsBefore: string;
  commentsBefore: PTNode[];

  _originalCode?: string;

  constructor(
    rule: ParsingExpression,
    range: [number, number],
    pres: {
      ws?: string;
      comments?: PTNode[];
    } = {},
  ) {
    this.rule = rule;
    this.start = range[0];
    this.end = range[1];
    this.wsBefore = pres.ws ?? "";
    this.commentsBefore = pres.comments ?? [];
  }

  get name() {
    return `${this.rule.name} [${this.start}:${this.end}]`;
  }

  abstract get value(): any;

  abstract get desc(): string;

  abstract flatStr(preserveComments: boolean): string;

  abstract hasContent(): boolean;

  treeStr(includeSuppressed: boolean = false, indent = 0) {
    return `${"  ".repeat(indent)}${this.name}${this.rule.suppress ? " ($)" : ""}`;
  }

  abstract toJSON(): any;

  abstract visit(visitors: Record<string, VisitorFn>): any;

  abstract get suppressed(): boolean;
}
