import {
  And,
  Choice,
  EOF,
  Keyword,
  Not,
  Optional,
  ParsingExpression,
  RegexMatch,
  Sequence,
  StringMatch,
  SUPPRESS,
} from "../parsing-expression";
import { Parser } from "../parser";
import { PTVisitor } from "../parset-tree/PTVisitor";
import { GrammarDef } from "../types";
import { PTNode } from "../parset-tree";
import { OneOrMore, ZeroOrMore } from "../parsing-expression/repetition";

const S_ = (str: string | RegExp) =>
  str instanceof RegExp
    ? new RegexMatch(str, { refiner: SUPPRESS })
    : new StringMatch(str, { refiner: SUPPRESS });

const choiceLine = () => new Sequence([choice, EOF], { refiner: 0 });

const sequenceLine = () => new Sequence([sequence, EOF], { refiner: 0 });

const choice = () =>
  new OneOrMore(sequence, {
    sep: S_("|"),
    refiner: (value) => (value.length === 1 ? value[0] : new Choice(value)),
  });

const withSeparator = () =>
  new Optional(["/", FullExpression], { refiner: (value) => value?.[1] });

const FullExpression = () =>
  new Sequence(
    [
      new Optional(new Choice(["&", "!", "#"])),
      expression,
      new Optional(
        new Choice(["?", ["*", withSeparator], ["+", withSeparator]]),
      ),
    ],
    { skipws: "" },
  );

const sequence = () =>
  new OneOrMore(FullExpression, {
    refiner: (value) => (value.length === 1 ? value[0] : new Sequence(value)),
  });

const expression = () =>
  new Choice([
    regex,
    str_match,
    keyword_match,
    RuleName,
    new Sequence(["(", choice, ")"], { refiner: 1 }),
  ]);

// PEG Lexical rules
const regex = () =>
  new RegexMatch(/\/(?:\\.|\[[^\]]+]|.)*?\/[gimsuy]*/, {
    refiner(value) {
      const match = /^\/(.*)\/(.*)$/.exec(value);
      return new RegexMatch(new RegExp(match![1], match![2]));
    },
  });

const RuleName = () => /[a-zA-Z_]([a-zA-Z_]|[0-9])*\b/;

const str_match = () =>
  new RegexMatch(/"(?:\\[^\n]|[^\n"])*?"|'(?:\\[^\n]|[^\n'])*?'/, {
    refiner: (value) => new StringMatch(value.slice(1, -1)),
  });

const keyword_match = () =>
  new RegexMatch(/k"(?:\\[^\n]|[^\n"])*?"|k'(?:\\[^\n]|[^\n'])*?'/, {
    refiner: (value) => new Keyword(value.slice(2, -1)),
  });

export type PEGObject = Record<
  string,
  RegExp | ParsingExpression | string | string[]
>;

export const Str = (str: string) => new StringMatch(str);

function parsePEGObject(obj: PEGObject): any {
  const rules: Record<string, GrammarDef> = {};
  const ruleRefGetter = (rule_name: string) => () => rules[rule_name];

  const _parse = (value: string, rule: GrammarDef) => {
    const pTree = Parser.parse(value, rule);
    return new PTVisitor(pTree, {
      afterRuleName(node: PTNode, value: string) {
        if (value === "EOF") {
          return EOF;
        }
        return ruleRefGetter(value);
      },
      afterFullExpression(node: PTNode, [pre, expr, post]: any) {
        const refiner = pre === "#" ? SUPPRESS : undefined;
        const syntaxPredicate = pre === "&" ? And : pre === "!" ? Not : null;
        const repetition =
          post === "?"
            ? Optional
            : post?.[0] === "*"
              ? ZeroOrMore
              : post?.[0] === "+"
                ? OneOrMore
                : null;

        const _sep = post?.[1] ?? undefined;

        if (repetition) {
          expr = new repetition(expr, { sep: _sep });
        } else {
          expr = new Sequence([expr]);
        }
        if (syntaxPredicate) {
          expr = new syntaxPredicate(expr);
        }
        expr.refiner = refiner;
        return expr;
      },
    }).visit();
  };

  const KEY_REGEX = /^[a-zA-Z_]([a-zA-Z_]|[0-9])*$/;
  for (const [key, value] of Object.entries(obj)) {
    if (!KEY_REGEX.test(key)) {
      throw new Error(`Invalid key: ${key}`);
    }

    if (value instanceof RegExp) {
      rules[key] = new RegexMatch(value);
    } else if (value instanceof ParsingExpression) {
      rules[key] = value;
    } else if (typeof value === "string") {
      rules[key] = _parse(value, choiceLine);
    } else if (Array.isArray(value)) {
      rules[key] = new Choice(value.map((x) => _parse(x, sequenceLine)));
    } else {
      throw new Error(`Invalid value for key: ${key}`);
    }
  }

  return rules;
}

const peg: PEGObject = {
  number: /\d*\.\d*|\d+/,
  factor: '#("+" | "-")? (number | "(" expression ")")',
  term: 'factor (("*" | "/" | "%") factor)*',
  expression: 'term (("+" | "-") term)*',
  calc: "expression EOF",
  b: "'x'",
  a: "b+/#','",

  x: "'x'?",
  y: "x+",
};

console.log(Parser.parse("(1 + 2) * 5", parsePEGObject(peg).calc).refined);
console.log(Parser.parse("x, x, x", parsePEGObject(peg).a).refined);
console.log(Parser.parse("", parsePEGObject(peg).y).refined);
