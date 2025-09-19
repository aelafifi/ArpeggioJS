import { Match, SUPPRESS } from "../parsing-expression";

import { PTNode } from "./PTNode";
import { getRefinerFunction } from "./utils";

export class Terminal extends PTNode {
  constructor(
    rule: Match,
    public value: string,
    range: [number, number],
    pres: {
      ws?: string;
      comments?: PTNode[];
    } = {},
  ) {
    super(rule, range, pres);
  }

  get desc() {
    return this.value
      ? `${this.rule.name} '${this.value}' [${this.start}:${this.end}]`
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

  get isSuppressed() {
    return this.rule.refiner === SUPPRESS;
  }

  get _value() {
    if (this.isSuppressed) {
      return null;
    }

    return this.value;
  }

  get refined(): any {
    if (this.isSuppressed) {
      return null;
    }

    const refiner = getRefinerFunction(this.rule.refiner) as Function;

    return refiner(this.value);
  }

  treeStr(indent = 0) {
    return `${super.treeStr(indent)}: ${this.value}`;
  }

  toJSON() {
    return {
      start: this.start,
      end: this.end,
      value: this.value,
    };
  }
}
