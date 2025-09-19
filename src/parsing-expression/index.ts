import { GrammarDef, RefinerFn } from "../types";
import {
  CommentsParser,
  Parser,
  StringManipulation,
  WhitespaceSkipper,
} from "../parser";
import { NoMatch } from "../errors";
import { NonTerminal, PTNode } from "../parset-tree";
import { Cascade, ParseManyOptions, ParsingExpressionOptions } from "./options";
import { IGNORE, withProps } from "prop-scope";

export const SUPPRESS: unique symbol = Symbol("__suppress__");

// TODO: should be used with single `reduce` property instead of should & could
export enum Reducibility {
  NONE,
  COULD,
  SHOULD,
}

export abstract class ParsingExpression {
  readonly shouldReduce: boolean = false;
  readonly couldReduce: boolean = false;

  ruleName: string;
  refiner?: RefinerFn | typeof SUPPRESS | number | number[];

  constructor(
    readonly elements: GrammarDef[],
    readonly options: ParsingExpressionOptions = {},
  ) {
    this.ruleName = options.ruleName ?? "";
    this.refiner = options.refiner;
  }

  get _ruleName() {
    return this.ruleName || this.constructor.name;
  }

  get name(): string {
    return this._ruleName;
  }

  parse(parser: Parser): PTNode {
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

  _doParsing(parser: Parser): PTNode {
    const comments = CommentsParser.parseComments(parser, this);
    const whitespaces = WhitespaceSkipper.skipWhitespaces(parser, this);
    const c_pos = parser.position;

    if (!parser.in_parse_comments) {
      parser.debug(
        `?? Try match rule ${this.name}${parser.in_rule ? " in " + parser.in_rule : ""} ${parser.atPosition()}`,
      );
    }

    let result = withProps(
      parser as any, // TODO: fix typing on the prop-scope package
      {
        skipws:
          this.options.skipws instanceof Cascade
            ? this.options.skipws.value
            : IGNORE,
        eolterm:
          this.options.eolterm instanceof Cascade
            ? this.options.eolterm.value
            : IGNORE,
        ignoreCase:
          this.options.ignoreCase !== undefined && !parser.in_match
            ? this.options.ignoreCase
            : IGNORE,
      },
      () => this._parse(parser),
    );

    if (result === null) {
      result = new NonTerminal(this, [], [c_pos, parser.position]);
    }

    if (Array.isArray(result)) {
      result = new NonTerminal(this, result, [c_pos, parser.position]);
    }

    result.wsBefore = whitespaces;
    result.commentsBefore = comments;
    return result;
  }

  abstract _parse(parser: Parser): PTNode | PTNode[] | null;
}

export class Expression extends ParsingExpression {
  readonly shouldReduce = true;

  constructor(
    readonly element: GrammarDef,
    readonly options: ParsingExpressionOptions = {},
  ) {
    super([element], options);
  }

  _parse(parser: Parser) {
    return parser.getRule(this.element).parse(parser);
  }
}

export class LexRule extends ParsingExpression {
  readonly shouldReduce = true;

  constructor(
    readonly element: GrammarDef,
    options: ParsingExpressionOptions = {},
  ) {
    super([element], options);
  }

  _parse(parser: Parser) {
    const old_in_lex_rule = parser.in_lex_rule;
    try {
      parser.in_lex_rule = true;
      return parser.getRule(this.element).parse(parser);
    } finally {
      parser.in_lex_rule = old_in_lex_rule;
    }
  }
}

export class Sequence extends ParsingExpression {
  readonly couldReduce = true;

  constructor(
    elements: GrammarDef[],
    readonly options: ParseManyOptions = {},
  ) {
    super(elements, options);
  }

  _parse(parser: Parser): PTNode[] {
    const results: PTNode[] = [];
    const c_pos = parser.position;
    const sep = this.options.sep ? parser.getRule(this.options.sep) : null;
    for (const element of this.elements) {
      const node = parser.getRule(element);
      try {
        if (sep && results.length > 0) {
          results.push(sep.parse(parser));
        }
        results.push(node.parse(parser));
      } catch (e) {
        if (e instanceof NoMatch) {
          parser.position = c_pos;
        }
        throw e;
      }
    }
    return results;
  }
}

export class LexSequence extends Sequence {
  _parse(parser: Parser) {
    const old_in_lex_rule = parser.in_lex_rule;
    try {
      parser.in_lex_rule = true;
      return super._parse(parser);
    } finally {
      parser.in_lex_rule = old_in_lex_rule;
    }
  }
}

export class Partial extends Sequence {
  constructor(elements: GrammarDef[], options: ParseManyOptions = {}) {
    super(elements, options);
  }

  _parse(parser: Parser): PTNode[] {
    const results: PTNode[] = [];
    let c_pos: number;
    const sep = this.options.sep ? parser.getRule(this.options.sep) : null;
    for (const element of this.elements) {
      c_pos = parser.position;
      const node = parser.getRule(element);
      try {
        if (sep && results.length > 0) {
          results.push(sep.parse(parser));
        }
        results.push(node.parse(parser));
      } catch (e) {
        if (e instanceof NoMatch) {
          parser.position = c_pos;
          break;
        }
        throw e;
      }
    }
    return results;
  }
}

export class Choice extends ParsingExpression {
  readonly shouldReduce = true;
  readonly couldReduce = true;

  constructor(elements: GrammarDef[], options: ParsingExpressionOptions = {}) {
    super(elements, options);
  }

  _parse(parser: Parser): [PTNode] {
    const c_pos = parser.position;
    for (const element of this.elements) {
      const node = parser.getRule(element);
      try {
        return [node.parse(parser)];
      } catch (e) {
        if (e instanceof NoMatch) {
          parser.position = c_pos;
        } else {
          throw e;
        }
      }
    }

    throw parser.noMatch(this, c_pos);
  }
}

export class UnorderedGroup extends Sequence {
  readonly couldReduce = true;

  constructor(elements: GrammarDef[], options: ParseManyOptions = {}) {
    super(elements, options);
  }

  _parse(parser: Parser): any {
    // TODO: implement
    throw new Error("Method not implemented.");
  }
}

export * from "./match";
export * from "./repetition";
export * from "./syntax-predicate";
export { MatchOptions } from "./options";
