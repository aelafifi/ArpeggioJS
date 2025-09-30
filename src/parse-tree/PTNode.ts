import { ParsingExpression } from "../parsing-expression";

export abstract class PTNode {
  rule: ParsingExpression;
  start: number;
  end: number;
  wsBefore: string;
  commentsBefore: PTNode[];

  _originalCode?: string;

  __refiner?: (node: PTNode, value: any) => any;
  __ruleName?: string;
  __suppress?: boolean;

  constructor(
    rule: ParsingExpression,
    range: [number, number],
    public _ruleName?: string,
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

  get ruleName() {
    return this._ruleName ?? this.rule.ruleName;
  }

  get name() {
    return `${this.rule.name} [${this.start}:${this.end}]`;
  }

  abstract get desc(): string;

  abstract get flatStr(): string;

  abstract hasContent(): boolean;

  treeStr(includeSuppressed: boolean = false, indent = 0) {
    return `${"  ".repeat(indent)}${this.name}`;
  }

  abstract toJSON(): any;
}
