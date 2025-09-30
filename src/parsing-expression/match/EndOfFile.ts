import { Match } from "./Match";
import { Parser } from "../../parser";
import { PTNode, Terminal } from "../../parse-tree";

class EndOfFile extends Match {
  constructor() {
    super("EOF", {
      ruleName: "EOF",
      suppress: true,
    });
  }

  _parse(parser: Parser): PTNode {
    if (parser.position === parser.input.length) {
      return new Terminal(this, "", [parser.position, parser.position]);
    }

    throw parser.noMatch(this);
  }
}

export const EOF = new EndOfFile();
