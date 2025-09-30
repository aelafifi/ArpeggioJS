import {
  Epsilon,
  Expression,
  Keyword,
  Match,
  Not,
  ParsingExpression,
  RegexMatch,
  Sequence,
  StringMatch,
} from "./parsing-expression";
import type { GrammarDef, ParserOptions } from "./types";
import { StringManipulation } from "./utils";
import { GrammarError, NoMatch } from "./errors";
import type { Node } from "./parse-tree";
import { withProps } from "prop-scope";

export const DEFAULT_WS = "\t\r\n ";

export const DEFAULT_KEYWORD_REGEX = /^[^\d\W]\w*$/;

export class Parser {
  readonly FIRST_NOT = new Not([]);

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
  // Result cache: [ParsingExpression, position] => [Node | null, newPosition]
  _resultCache: Map<[ParsingExpression, number], [Node | null, number]> =
    new Map();
  resultCacheHits: number = 0;
  resultCacheMisses: number = 0;

  // Rule cache: GrammarDef => ParsingExpression
  _ruleCache: Map<GrammarDef, ParsingExpression> = new Map();
  ruleCacheHits: number = 0;
  ruleCacheMisses: number = 0;

  // Options
  commentsModel?: GrammarDef;
  autokwd: boolean;
  ignoreCase?: boolean;
  skipws: string;
  eolterm: boolean;

  // For debugging
  _debug: boolean;
  _debugIndent: number = 0;

  lineEnds: number[] = [];

  constructor(
    readonly input: string,
    readonly options: ParserOptions = {},
  ) {
    this._debug = options.debug ?? false;
    this.skipws = options.skipws ?? DEFAULT_WS;
    this.eolterm = options.eolterm ?? false;
    this.commentsModel = options.commentsModel;
    this.autokwd = options.autokwd ?? true;
    this.ignoreCase = options.ignoreCase;
  }

  skipWhitespaces(): string {
    const skipws = this.eolterm
      ? this.skipws.replace(/[\r\n]/g, "")
      : this.skipws;
    let whitespaces = "";

    if (!skipws || this.in_lex_rule) {
      return whitespaces;
    }

    while (
      this.position < this.input.length &&
      skipws.includes(this.input[this.position])
    ) {
      whitespaces += this.input[this.position++];
    }

    return whitespaces;
  }

  parseComments(): Node[] {
    if (this.in_lex_rule || this.in_parse_comments || !this.commentsModel) {
      return [];
    }

    return withProps(this as any, { in_parse_comments: true }, () => {
      const comments: Node[] = [];

      try {
        // eslint-disable-next-line no-constant-condition
        while (true) {
          comments.push(this.getRule(this.commentsModel!).parse(this));
        }
      } catch (e) {
        if (e instanceof NoMatch) {
          // NoMatch in comment matching is perfectly legal, and no action should be taken.
        } else {
          throw e;
        }
      }

      return comments;
    });
  }

  static parse(
    input: string,
    parseModel: GrammarDef,
    options?: ParserOptions,
  ): Node {
    // TODO: Could we make the Parser instance reusable for multiple parse calls?
    const parser = new Parser(input, options ?? {});
    let pt_node: Node;
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

    // We only keep the farthest noMatch, unless we are in comment parsing mode.
    if (this._noMatch === undefined || !this.in_parse_comments) {
      // If we are in a not expression, we use a special marker rule to indicate that.
      if (this._noMatch === undefined || position > this._noMatch.position) {
        this._noMatch = this.in_not
          ? new NoMatch([this.FIRST_NOT], position, this)
          : new NoMatch([rule], position, this);
      }

      // If we are at the same position as the current noMatch, we add the rule to the list of rules.
      else if (
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

    // Otherwise, return the current noMatch as it's the farthest one.
    return this._noMatch;
  }

  getRule(x: GrammarDef): ParsingExpression {
    if (this._ruleCache.has(x)) {
      this.ruleCacheHits++;
      const cachedRule = this._ruleCache.get(x);
      if (cachedRule instanceof ParsingExpression) {
        return cachedRule;
      }
    }
    const rule = this._getRule(x);
    this.ruleCacheMisses++;
    this._ruleCache.set(x, rule);
    return rule;
  }

  private _getRule(x: GrammarDef): ParsingExpression {
    if (x === null) {
      // If x is null or undefined, it means it should match nothing (epsilon).
      return Epsilon;
    }

    if (x instanceof ParsingExpression) {
      return x;
    }

    if (typeof x === "string" || x instanceof String) {
      // If x is a string, it means it should match that exact string.
      const s = "" + x;

      // If autokwd is enabled and the string matches the keyword regex, treat it as a keyword.
      if (this.autokwd && DEFAULT_KEYWORD_REGEX.test(s)) {
        return new Keyword(s);
      }

      // Otherwise, treat it as a simple string match.
      return new StringMatch(s);
    }

    if (x instanceof RegExp) {
      // If x is a RegExp, it means it should match that regex.
      return new RegexMatch(x);
    }

    if (Array.isArray(x)) {
      // If x is an array, it means it should be treated as a sequence of expressions.
      return new Sequence(x);
    }

    if (typeof x === "function") {
      // If x is a function, it means it should be treated as a rule reference.
      const ruleName = x.name;
      let expr: GrammarDef = x();

      // Unlock all nested anonymous functions (e.g., () => () => ... )
      while (typeof expr === "function" && expr.name === "") {
        expr = expr();
      }

      return this.__getFunctionPE(expr, ruleName);
    }

    throw new GrammarError(`Unknown expression/rule: ${x}`);
  }

  private __getFunctionPE(
    expr: GrammarDef,
    ruleName: string,
  ): ParsingExpression {
    if (expr === null) {
      return Epsilon;
    }

    if (typeof expr === "string" || expr instanceof String) {
      const s = "" + expr;
      if (this.autokwd && DEFAULT_KEYWORD_REGEX.test(s)) {
        return new Keyword(s, { ruleName });
      }
      return new StringMatch(s, { ruleName });
    }

    if (expr instanceof RegExp) {
      return new RegexMatch(expr, { ruleName });
    }

    if (Array.isArray(expr)) {
      return new Sequence(expr, { ruleName });
    }

    if (expr instanceof ParsingExpression) {
      return new Expression(expr, { ruleName, suppress: expr.suppress });
    }

    return new Expression(expr, { ruleName });
  }
}
