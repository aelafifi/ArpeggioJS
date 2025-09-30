import { GrammarDef } from "../../types";
import { PEOptions, VisitorFn } from "../types";
import {
  CommentsParser,
  Parser,
  StringManipulation,
  WhitespaceSkipper,
} from "../../parser";
import { Node, NonTerminal } from "../../parse-tree";
import { NoMatch } from "../../errors";
import { IGNORE, withProps } from "prop-scope";

export abstract class ParsingExpression {
  ruleName: string;
  refiner?: VisitorFn;
  suppress: boolean;

  constructor(
    readonly elements: GrammarDef[],
    readonly options: PEOptions = {},
  ) {
    this.ruleName = options.ruleName ?? "";
    this.refiner = options.refiner;
    this.suppress = options.suppress ?? false;
  }

  get _ruleName() {
    return this.ruleName || "#" + this.constructor.name;
  }

  get name(): string {
    return this._ruleName;
  }

  parse(parser: Parser): Node {
    const c_pos = parser.position;

    if (!parser.in_match) {
      parser.debug(
        `>> Matching rule ${this.name}${parser.in_rule ? " in " + parser.in_rule : ""} ${parser.atPosition()}`,
        1,
      );
    }

    if (parser._resultCache.has([this, parser.position])) {
      const [result, newPosition] = parser._resultCache.get([
        this,
        parser.position,
      ])!;
      parser.position = newPosition;
      parser.resultCacheHits++;

      if (!parser.in_match) {
        parser.debug(
          `** Cache hit for [${this.name}, ${c_pos}] = '${result}' : new_pos=${StringManipulation.getLineColStr(parser)}`,
        );
        parser.debug(
          `<<+ Matched rule ${this.name} ${parser.atPosition()}`,
          -1,
        );
      }

      if (result === null) {
        throw parser._noMatch;
      }

      return result;
    } else {
      parser.resultCacheMisses++;
    }

    const c_lastParsingExpression = parser.lastParsingExpression;
    parser.lastParsingExpression = this;

    const c_inRule = parser.in_rule;
    if (this.ruleName) {
      parser.in_rule = this.ruleName;
    }

    let result;
    try {
      result = this._doParsing(parser);
    } catch (e) {
      if (e instanceof NoMatch) {
        parser.position = c_pos;
        parser._resultCache.set([this, c_pos], [null, parser.position]);
      }

      throw e;
    } finally {
      parser.lastParsingExpression = c_lastParsingExpression;

      if (!parser.in_match) {
        parser.debug(
          `<<${parser.position === c_pos ? "- Not matched" : "+ Matched"} rule ${this.name}${parser.in_rule ? " in " + parser.in_rule : ""} ${parser.atPosition()}`,
          -1,
        );
      }

      parser.in_rule = c_inRule;
    }

    return result;
  }

  _doParsing(parser: Parser): Node {
    const init_pos = parser.position;
    const comments = CommentsParser.parseComments(parser);
    const whitespaces = WhitespaceSkipper.skipWhitespaces(parser);
    const c_pos = parser.position;

    if (!parser.in_parse_comments) {
      parser.debug(
        `?? Try match rule ${this.name}${parser.in_rule ? " in " + parser.in_rule : ""} ${parser.atPosition()}`,
      );
    }

    let result = withProps(
      parser as any, // TODO: fix typing on the prop-scope package
      {
        skipws: this.options.skipws ?? IGNORE,
        eolterm: this.options.eolterm ?? IGNORE,
        in_lex_rule: this.options.lex ?? IGNORE,
        ignoreCase: this.options.ignoreCase ?? IGNORE,
      },
      () => this._parse(parser),
    );

    if (result === null) {
      result = new NonTerminal(this, [], [c_pos, parser.position]);
      parser.position = init_pos;
      return result;
    }

    if (Array.isArray(result)) {
      result = new NonTerminal(this, result, [c_pos, parser.position]);
    }

    // Nodes that doesn't match any content, shouldn't catch whitespaces and comments,
    // delegate them to be caught by the next matching node.
    if (!result.hasContent) {
      result.commentsBefore = [];
      result.wsBefore = "";
      parser.position = init_pos;
      return result;
    }

    result.wsBefore = whitespaces;
    result.commentsBefore = comments;
    return result;
  }

  abstract _parse(parser: Parser): Node | Node[] | null;
}
