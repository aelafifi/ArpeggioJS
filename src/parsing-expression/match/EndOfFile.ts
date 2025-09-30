import { Match } from "./Match";
import { Parser } from "../../parser";
import { Node, Terminal } from "../../parse-tree";

class EndOfFile extends Match {
  constructor() {
    super("EOF", {
      ruleName: "EOF",
      suppress: true,
    });
  }

  _parse(parser: Parser): Node {
    if (parser.position === parser.input.length) {
      return new Terminal(this, "", [parser.position, parser.position]);
    }

    throw parser.noMatch(this);
  }
}

export const EOF = new EndOfFile();
