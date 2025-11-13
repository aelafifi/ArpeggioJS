import {
  and,
  choice,
  EOF,
  Epsilon,
  keyword,
  match$,
  not,
  oneOrMore,
  optional,
  ParsingExpression,
  regexMatch,
  sequence,
  stringMatch,
  zeroOrMore,
  expression,
  repetition,
  match,
} from "../parsing-expression";
import { DEFAULT_WS, Parser } from "../parser";
import { Node } from "../parse-tree";
import { GrammarDef } from "../types";

const choiceLine = () => [_choice, EOF];

const sequenceLine = () => [_sequence, EOF];

const _choice = () =>
  oneOrMore(_sequence, { sep: match$("|"), ruleName: "choice" });

const _sequence = () => oneOrMore(FullExpression, { ruleName: "sequence" });

// TODO: allow repRange max to infinity
const repRange = [
  match$("{"),
  regexMatch(/\d+/, {
    refiner: (node: Node, value: string) => parseInt(value),
  }),
  optional([
    match$(","),
    regexMatch(/\d+/, {
      refiner: (node: Node, value: string) => parseInt(value),
    }),
  ]),
  match$("}"),
];

// TODO: Support `Partial` and `UnorderedGroup` types in PEGObject
const FullExpression = () =>
  sequence(
    [
      optional(choice(["&", "!", "#"])),
      _expression,
      optional(choice(["?", [choice(["*", "+", repRange]), withSeparator]])),
    ],
    {
      skipws: "",
      ruleName: "full_expression",
    },
  );

const withSeparator = () => optional([match$("/"), FullExpression]);

const _expression = () =>
  choice([
    match("EOF", { refiner: () => EOF }),
    RuleName,
    regex,
    str_match,
    keyword_match,
    // TODO: allow `sequence` with `sep`
    sequence([match$("("), _choice, match$(")")], { skipws: DEFAULT_WS }),
  ]);

// PEG Lexical rules
const regex = regexMatch(/\/(?:\\.|\[[^\]]+]|.)*?\/[gimsuy]*/, {
  refiner(node: Node, value: string) {
    const match = /^\/(.*)\/(.*)$/.exec(value);
    return regexMatch(new RegExp(match![1], match![2]));
  },
});

const RuleName = () => /[a-zA-Z_]\w*\b/;

const str_match = regexMatch(/"(?:\\[^\n]|[^\n"])*?"|'(?:\\[^\n]|[^\n'])*?'/, {
  refiner: (node: Node, value: string) => stringMatch(value.slice(1, -1)),
});

const keyword_match = () =>
  regexMatch(/k"(?:\\[^\n]|[^\n"])*?"|k'(?:\\[^\n]|[^\n'])*?'/, {
    refiner: (node: Node, value: string) => keyword(value.slice(2, -1)),
  });

export type PEGObject = Record<
  string,
  RegExp | ParsingExpression | string | string[]
>;

function parsePEGObject(obj: PEGObject): any {
  const rules: Record<string, GrammarDef> = {};
  const parser = new Parser(null);

  const _parse = (value: string, rule: GrammarDef) =>
    parser.parse(value, rule).visit({
      choice: (node: Node, value: any[]) =>
        value.length > 1 ? choice(value) : value[0],

      sequence: (node: Node, value: any[]) =>
        value.length > 1 ? sequence(value) : value[0],

      full_expression: (node: Node, [pre, expr, post]) => {
        // Auto `suppress` if matched value is suppressed
        if (expr === null) {
          return null;
        }

        const suppress = pre === "#";
        const _id = (rule: GrammarDef, ...args: any[]) => rule;
        const _syntaxPredicate =
          pre === "&" ? and : pre === "!" ? not : expression;
        let _repetition = post === "?" ? optional : _id;
        const opts: any = {};
        if (Array.isArray(post)) {
          if (post[0] === "*") {
            _repetition = zeroOrMore;
            opts.sep = post[1] ?? undefined;
          } else if (post[0] === "+") {
            _repetition = oneOrMore;
            opts.sep = post[1] ?? undefined;
          } else if (Array.isArray(post[0])) {
            let [min, max] = post[0];
            max = max ?? min;
            _repetition = repetition;
            opts.min = min;
            opts.max = max;
            opts.sep = post[1] ?? undefined;
          }
        }

        return _syntaxPredicate(_repetition(expr, opts), { suppress });
      },

      RuleName: (node: Node, value: string) => () => rules[value],
    });

  const KEY_REGEX = /^[a-zA-Z_]\w*$/;
  for (const [key, value] of Object.entries(obj)) {
    if (!KEY_REGEX.test(key)) {
      throw new Error(`Invalid key: ${key}`);
    }

    if (["EOF"].includes(key)) {
      throw new Error(`Key cannot be a reserved word: ${key}`);
    }

    if (value instanceof RegExp) {
      rules[key] = regexMatch(value);
    } else if (value instanceof ParsingExpression) {
      rules[key] = value;
    } else if (typeof value === "string") {
      rules[key] = _parse(value, choiceLine);
      (rules[key] as ParsingExpression).ruleName = key;
    } else if (Array.isArray(value)) {
      rules[key] = choice(value.map((x) => _parse(x, sequenceLine)));
      (rules[key] as ParsingExpression).ruleName = key;
    } else {
      throw new Error(`Invalid value for key: ${key}`);
    }
  }

  return rules;
}

const peg: PEGObject = {
  // number: /\d*\.\d*|\d+/,
  // factor: '#("+" | "-")? (number | "(" expression ")")',
  // term: 'factor (("*" | "/" | "%") factor)*',
  // expression: 'term (("+" | "-") term)*',
  // calc: "expression EOF",
  b: "'x'",
  a: "b{2,5}/#',' EOF",

  // x: "'x'?",
  // y: "x+ | '12'",
};

// console.log(parsePEGObject(peg).a.elements);

console.log(
  // new Parser().parse("(1 + 2) * 5", parsePEGObject(peg).calc).treeStr(),
  new Parser().parse("x, x, x", parsePEGObject(peg).a).value,
);
// console.log(new Parser().parse("", parsePEGObject(peg).y).value);
