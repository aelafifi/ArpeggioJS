import { PTNode } from "./PTNode";
import { getRefinerFunction } from "./utils";
import { SUPPRESS } from "../parsing-expression/constants";
import { ParsingExpression } from "../parsing-expression/basic/ParsingExpression";
import { Match, SyntaxPredicate } from "../parsing-expression";

export class Terminal extends PTNode {
  constructor(
    rule: Match | SyntaxPredicate,
    public value: string,
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
    return this.value
      ? `${this.ruleName} '${this.value}' [${this.start}:${this.end}]`
      : this.name;
  }

  get flatStr(): string {
    return (
      this._originalCode ??
      this.commentsBefore.map((c) => c.flatStr).join() +
        this.wsBefore +
        this.value
    );
  }

  treeStr(includeSuppressed: boolean = false, indent = 0) {
    return `${super.treeStr(includeSuppressed, indent)}: "${this.value}"`;
  }

  hasContent(): boolean {
    return this.value !== "";
  }

  toJSON() {
    return {
      start: this.start,
      end: this.end,
      value: this.value,
    };
  }
}
