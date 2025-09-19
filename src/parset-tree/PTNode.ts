import { ParsingExpression } from "../parsing-expression";

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

  abstract get isSuppressed(): boolean;

  abstract get desc(): string;

  abstract get flatStr(): string;

  abstract get _value(): any;

  abstract get refined(): any;

  treeStr(indent = 0) {
    return `${"  ".repeat(indent)}${this.name}`;
  }

  abstract toJSON(): any;
}
