import { GrammarDef } from "../../types";
import { PEOptions, VisitorFn } from "../types";
import { ParserContext } from "../../parser";
import { Node, NonTerminal } from "../../parse-tree";
import { NoMatch } from "../../errors";
import { IGNORE, withProps } from "prop-scope";
import { StringManipulation } from "../../utils";

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

  parse(ctx: ParserContext): Node {
    const c_pos = ctx.position;

    if (!ctx.in_match) {
      ctx.debug(
        `>> Matching rule ${this.name}${ctx.in_rule ? " in " + ctx.in_rule : ""} ${ctx.atPosition()}`,
        1,
      );
    }

    if (ctx._resultCache.has([this, ctx.position])) {
      const [result, newPosition] = ctx._resultCache.get([this, ctx.position])!;
      ctx.position = newPosition;
      ctx.resultCacheHits++;

      if (!ctx.in_match) {
        ctx.debug(
          `** Cache hit for [${this.name}, ${c_pos}] = '${result}' : new_pos=${StringManipulation.getLineColStr(ctx)}`,
        );
        ctx.debug(`<<+ Matched rule ${this.name} ${ctx.atPosition()}`, -1);
      }

      if (result === null) {
        throw ctx._noMatch;
      }

      return result;
    } else {
      ctx.resultCacheMisses++;
    }

    const c_lastParsingExpression = ctx.lastParsingExpression;
    ctx.lastParsingExpression = this;

    const c_inRule = ctx.in_rule;
    if (this.ruleName) {
      ctx.in_rule = this.ruleName;
    }

    let result;
    try {
      result = this._doParsing(ctx);
    } catch (e) {
      if (e instanceof NoMatch) {
        ctx.position = c_pos;
        ctx._resultCache.set([this, c_pos], [null, ctx.position]);
      }

      throw e;
    } finally {
      ctx.lastParsingExpression = c_lastParsingExpression;

      if (!ctx.in_match) {
        ctx.debug(
          `<<${ctx.position === c_pos ? "- Not matched" : "+ Matched"} rule ${this.name}${ctx.in_rule ? " in " + ctx.in_rule : ""} ${ctx.atPosition()}`,
          -1,
        );
      }

      ctx.in_rule = c_inRule;
    }

    return result;
  }

  _doParsing(parser: ParserContext): Node {
    const init_pos = parser.position;
    const comments = parser.parseComments();
    const whitespaces = parser.skipWhitespaces();
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

  abstract _parse(parser: ParserContext): Node | Node[] | null;
}
