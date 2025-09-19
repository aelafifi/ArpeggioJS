import { ParsingExpression, SUPPRESS } from "./index";
import { Parser } from "../parser";
import { PTNode, Terminal } from "../parset-tree";
import { GrammarError } from "../errors";
import { DEFAULT_KEYWORD_REGEX } from "../types";
import { MatchOptions } from "./options";
import { withProps } from "prop-scope";

export abstract class Match extends ParsingExpression {
  ignoreCase?: boolean;

  constructor(
    readonly pattern: string | RegExp,
    readonly options: MatchOptions = {},
  ) {
    super([pattern], options);
    this.ignoreCase = options.ignoreCase;
  }

  get name() {
    const prefix = this.ruleName ? `${this.ruleName}=` : "";
    return `${prefix}${this.constructor.name}(${this.pattern})`;
  }

  parse(parser: Parser): PTNode {
    return withProps(parser, { in_match: true }, () => super.parse(parser));
  }
}

export class StringMatch extends Match {
  declare readonly pattern: string;

  _parse(parser: Parser): PTNode {
    const c_pos = parser.position;
    const ignoreCase = this.ignoreCase ?? parser.ignoreCase;

    const a = ignoreCase ? this.pattern.toLowerCase() : this.pattern;
    const part = parser.input.slice(
      parser.position,
      parser.position + a.length,
    );
    const b = ignoreCase ? part.toLowerCase() : part;
    if (a === b) {
      parser.debug(
        `++ Match '${this.pattern}' ${parser.atPosition(c_pos, a.length)}`,
      );
      parser.position += a.length;
      return new Terminal(this, part, [c_pos, parser.position]);
    }

    parser.debug(`-- No match '${this.pattern}' ${parser.atPosition(c_pos)}`);
    throw parser.noMatch(this, c_pos);
  }
}

export class RegexMatch extends Match {
  declare readonly pattern: RegExp;

  getRegex(parser: Parser) {
    const ignoreCase = this.ignoreCase ?? parser.ignoreCase;
    if (ignoreCase === true && !this.pattern.ignoreCase) {
      const flags = this.pattern.flags + "i";
      return new RegExp(this.pattern.source, flags);
    }
    return this.pattern;
  }

  _parse(parser: Parser): PTNode {
    const c_pos = parser.position;
    const regex = this.getRegex(parser);
    const part = parser.input.slice(parser.position);
    const match = part.match(regex);

    if (match === null || match.index !== 0) {
      parser.debug(`-- No match ${this.pattern} ${parser.atPosition(c_pos)}`);
      throw parser.noMatch(this, c_pos);
    }

    parser.debug(
      `++ Match ${regex} ${parser.atPosition(c_pos, match[0].length)}`,
    );
    parser.position += match[0].length;
    return new Terminal(this, match[0], [c_pos, c_pos + match[0].length]);
  }
}

export class Keyword extends RegexMatch {
  constructor(kw: string, options: MatchOptions = {}) {
    if (!DEFAULT_KEYWORD_REGEX.test(kw)) {
      throw new GrammarError(`Invalid keyword: ${kw}`);
    }

    super(new RegExp(kw + "\\b"), {
      ruleName: "keyword",
      ...options,
    });
  }
}

export class EndOfFile extends Match {
  constructor(options: MatchOptions = {}) {
    super("EOF", {
      ruleName: "EOF",
      refiner: SUPPRESS,
      ...options,
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
