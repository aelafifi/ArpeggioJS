import { Match } from "./Match";
import { ParserContext } from "../../parser";
import { Node, Terminal } from "../../parse-tree";

class EndOfFile extends Match {
  constructor() {
    super("EOF", {
      ruleName: "EOF",
      suppress: true,
    });
  }

  _parse(ctx: ParserContext): Node {
    if (ctx.position === ctx.input.length) {
      return new Terminal(this, "", [ctx.position, ctx.position]);
    }

    throw ctx.noMatch(this);
  }
}

export const EOF = new EndOfFile();
