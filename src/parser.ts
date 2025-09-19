import {
  Empty,
  Keyword,
  Match,
  Not,
  ParsingExpression,
  RegexMatch,
  Sequence,
  StringMatch,
} from "./parsing-expression";
import { DEFAULT_KEYWORD_REGEX, DEFAULT_WS, GrammarDef } from "./types";
import { bisectLeft } from "./utils";
import { GrammarError, NoMatch } from "./errors";
import { PTNode } from "./parset-tree";
import { Cascade } from "./parsing-expression/options";

export class WhitespaceSkipper {
  static getSkipWS(parser: Parser, expr: any): string {
    const exprSkipWS =
      expr.options.skipws instanceof Cascade ? undefined : expr.options.skipws;
    const skipws = exprSkipWS ?? parser.skipws ?? DEFAULT_WS;
    return WhitespaceSkipper.getEOLTerm(parser, expr)
      ? skipws.replace(/[\r\n]/g, "")
      : skipws;
  }

  static getEOLTerm(parser: Parser, expr: any): boolean {
    const exprEOLTerm =
      expr.options.eolterm instanceof Cascade
        ? undefined
        : expr.options.eolterm;
    return exprEOLTerm ?? parser.eolterm ?? false;
  }

  static skipWhitespaces(parser: Parser, rule: any): string {
    const skipws = WhitespaceSkipper.getSkipWS(parser, rule);
    let whitespaces = "";

    if (!skipws || parser.in_lex_rule) {
      return whitespaces;
    }

    while (
      parser.position < parser.input.length &&
      skipws.includes(parser.input[parser.position])
    ) {
      whitespaces += parser.input[parser.position];
      parser.position++;
    }

    return whitespaces;
  }
}

export class CommentsParser {
  static parseComments(parser: Parser, expr: any): PTNode[] {
    if (
      parser.in_lex_rule ||
      parser.in_parse_comments ||
      !parser.commentsModel
    ) {
      return [];
    }

    const comments: PTNode[] = [];
    try {
      parser.in_parse_comments = true;
      try {
        // eslint-disable-next-line no-constant-condition
        while (true) {
          comments.push(parser.getRule(parser.commentsModel).parse(parser));
        }
      } catch (e) {
        if (e instanceof NoMatch) {
          // NoMatch in comment matching is perfectly legal and no action should be taken.
        } else {
          throw e;
        }
      }
    } finally {
      parser.in_parse_comments = false;
    }
    return comments;
  }
}

export class StringManipulation {
  static getLineCol(parser: Parser, position?: number): [number, number] {
    position ??= parser.position;
    if (parser.lineEnds.length === 0) {
      let last_line_end = parser.input.indexOf("\n");

      while (last_line_end !== -1) {
        parser.lineEnds.push(last_line_end);
        last_line_end = parser.input.indexOf("\n", last_line_end + 1);
      }
    }

    const line = bisectLeft(parser.lineEnds, position);
    let col = position;
    if (line > 0) {
      col -= parser.lineEnds[line - 1];
      if ("\n\r".includes(parser.input[parser.lineEnds[line - 1]])) {
        col--;
      }
    }

    return [line + 1, col + 1];
  }

  static getLineColStr(parser: Parser, position?: number): string {
    const [line, col] = StringManipulation.getLineCol(parser, position);
    return `${line}:${col}`;
  }

  static getContext(parser: Parser, position?: number, length?: number) {
    position = position ?? parser.position;
    const windowSize = 10;

    let retval: string;
    if (length) {
      const a = parser.input.slice(
        Math.max(position - windowSize, 0),
        position,
      );
      const b = parser.input.slice(position, position + length);
      const c = parser.input.slice(position + length, position + windowSize);
      retval = `${a}•${b}•${c}`;
    } else {
      const a = parser.input.slice(
        Math.max(position - windowSize, 0),
        position,
      );
      const b = parser.input.slice(position, position + windowSize);
      retval = `${a}•${b}`;
    }

    return retval.replace(/(?=[\r\n])\r?\n?/g, "⏎");
  }

  static atPosContext(parser: Parser, position?: number, length?: number) {
    const lineColStr = StringManipulation.getLineColStr(parser, position);
    const context = StringManipulation.getContext(parser, position, length);
    return `${lineColStr} => '${context}'`;
  }
}

export interface ParserOptions {
  debug?: boolean;
  ignoreCase?: boolean;
  skipws?: string;
  eolterm?: boolean;
  commentsModel?: GrammarDef;
  autokwd?: boolean;
}

export class Parser {
  readonly FIRST_NOT = new Not([]);

  // Core
  parserModel!: ParsingExpression;

  // State
  in_rule?: string;
  in_parse_comments = false;
  in_lex_rule = false;
  in_not = false;
  in_match: boolean = false;
  lastParsingExpression?: ParsingExpression;
  position: number = 0;
  _noMatch?: NoMatch;

  // Cache
  resultCacheHits: number = 0;
  resultCacheMisses: number = 0;
  _resultCache: Map<[ParsingExpression, number], [PTNode | null, number]> =
    new Map();

  ruleCacheHits: number = 0;
  ruleCacheMisses: number = 0;
  _ruleCache: Map<expr, ParsingExpression> = new Map();

  // Options
  commentsModel?: GrammarDef;
  autokwd: boolean;
  ignoreCase?: boolean;
  skipws?: string;
  eolterm?: boolean;

  // For debugging
  _debug: boolean;
  _debugIndent: number = 0;

  lineEnds: number[] = [];

  constructor(
    readonly input: string,
    readonly options: ParserOptions = {},
  ) {
    this._debug = options.debug ?? false;
    this.skipws = options.skipws;
    this.eolterm = options.eolterm;
    this.commentsModel = options.commentsModel;
    this.autokwd = options.autokwd ?? true;
    this.ignoreCase = options.ignoreCase;
  }

  static parse(
    input: string,
    parseModel: GrammarDef,
    options?: ParserOptions,
  ): PTNode {
    const parser = new Parser(input, options ?? {});
    let pt_node: PTNode;
    try {
      pt_node = parser.getRule(parseModel).parse(parser);
    } catch (e) {
      if (e instanceof NoMatch) {
        if (e.rules[0] === parser.FIRST_NOT) {
          e.rules.splice(0, 1);
        }
      }
      throw e;
    }

    return pt_node;
  }

  debug(msg: string, indentChange: number = 0) {
    if (this._debug) {
      if (indentChange < 0) {
        this._debugIndent += indentChange;
      }
      console.log("  ".repeat(this._debugIndent) + msg);
      if (indentChange > 0) {
        this._debugIndent += indentChange;
      }
    }
  }

  atPosition(position?: number, length: number = 0): string {
    position ??= this.position;
    return (
      "at position " + StringManipulation.atPosContext(this, position, length)
    );
  }

  noMatch(rule: ParsingExpression, position?: number) {
    position ??= this.position;
    if (this._noMatch === undefined || !this.in_parse_comments) {
      if (this._noMatch === undefined || position > this._noMatch.position) {
        this._noMatch = this.in_not
          ? new NoMatch([this.FIRST_NOT], position, this)
          : new NoMatch([rule], position, this);
      } else if (
        position == this._noMatch.position &&
        rule instanceof Match &&
        !this.in_not
      ) {
        this._noMatch = new NoMatch(
          [...this._noMatch.rules, rule],
          position,
          this,
        );
      }
    }

    return this._noMatch;
  }

  getRule(x: GrammarDef): ParsingExpression {
    if (this._ruleCache.has(x)) {
      this.ruleCacheHits++;
      return this._ruleCache.get(x)!;
    }
    const rule = this._getRule(x);
    this.ruleCacheMisses++;
    this._ruleCache.set(x, rule);
    return rule;
  }

  private _getRule(x: GrammarDef): ParsingExpression {
    if (x === null) {
      return new Empty();
    }

    if (x instanceof ParsingExpression) {
      return x;
    }

    if (typeof x === "string" || x instanceof String) {
      const s = "" + x;
      if (this.autokwd && DEFAULT_KEYWORD_REGEX.test(s)) {
        return new Keyword(s);
      }
      return new StringMatch(s);
    }

    if (x instanceof RegExp) {
      return new RegexMatch(x);
    }

    if (Array.isArray(x)) {
      if (x.length === 1) {
        return this.getRule(x[0]);
      }
      return new Sequence(x);
    }

    if (typeof x === "function") {
      const result = this.getRule(x());
      result.ruleName ||= x.name;
      return result;
    }

    throw new GrammarError(`Unknown expression/rule: ${x}`);
  }
}
