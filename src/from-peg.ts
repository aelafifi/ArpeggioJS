// Lexical invariants
import {
  Choice,
  EOF,
  Keyword,
  LexSequence,
  Optional,
  RegexMatch,
  Sequence,
  StringMatch,
  SUPPRESS,
} from "./parsing-expression";
import { Parser } from "./parser";
import { Terminal } from "./parset-tree";
import { And, Not } from "./parsing-expression/syntax-predicate";
import { OneOrMore, ZeroOrMore } from "./parsing-expression/repetition";

const COLON = new StringMatch(":", { refiner: SUPPRESS });
const ORDERED_CHOICE = new StringMatch("|", { refiner: SUPPRESS });
const ZERO_OR_MORE = "*";
const ONE_OR_MORE = "+";
const OPTIONAL = "?";
// const UNORDERED_GROUP = "#";
const AND = "&";
const NOT = "!";
const OPEN = new StringMatch("(", { refiner: SUPPRESS });
const CLOSE = new StringMatch(")", { refiner: SUPPRESS });

// PEG syntax rules
const peggrammar = () => new Sequence([new OneOrMore(rule), EOF]);

const rule = () =>
  new Sequence([
    rule_name,
    COLON,
    new Optional(new LexSequence([/\n\s*/, ORDERED_CHOICE]), {
      refiner: SUPPRESS,
    }),
    ordered_choice,
  ]);

const ordered_choice = () =>
  new OneOrMore(sequence, {
    sep: ORDERED_CHOICE,
    refiner(node, children) {
      if (children.length === 1) {
        return children[0];
      }
      return new Choice(children);
    },
  });

const fullExpression = () =>
  new Sequence(
    [
      new Optional([AND, NOT]),
      expression,
      new Optional(new Choice([OPTIONAL, ZERO_OR_MORE, ONE_OR_MORE])),
    ],
    {
      skipws: "",
      refiner(node, children) {
        const [syntaxPredicate, expression, quantifier] = children;
        let x = expression;

        switch (quantifier) {
          case ZERO_OR_MORE:
            x = new ZeroOrMore(x);
            break;
          case ONE_OR_MORE:
            x = new OneOrMore(x);
            break;
          case OPTIONAL:
            x = new Optional(x);
            break;
        }

        switch (syntaxPredicate) {
          case AND:
            x = new And(x);
            break;
          case NOT:
            x = new Not(x);
            break;
        }

        return x;
      },
    },
  );
const sequence = () =>
  new OneOrMore(fullExpression, {
    refiner(node, children) {
      if (children.length === 1) {
        return children[0];
      }
      return new Sequence(children);
    },
  });

const premetive = () => new Choice([regex, str_match, keyword_match]);

const expression = () => [
  new Choice([premetive, rule_crossref, [OPEN, ordered_choice, CLOSE]]),
  new Not(COLON),
];

// PEG Lexical rules
const regex = new RegexMatch(/\/(?:\\.|\[[^\]]+]|.)*?\/[gimsuy]*/, {
  refiner(node) {
    const match = /^\/(.*)\/(.*)$/.exec((node as Terminal).value);
    return new RegexMatch(new RegExp(match![1], match![2]));
  },
});

const rule_name = /[a-zA-Z_]([a-zA-Z_]|[0-9])*\b/;

const rule_crossref = new RegexMatch(rule_name);

const str_match = new RegexMatch(/"(?:\\[^\n]|[^\n"])*?"/, {
  refiner(node) {
    return new StringMatch((node as Terminal).value.slice(1, -1));
  },
});

const keyword_match = new RegexMatch(/k"(?:\\[^\n]|[^\n"])*?"/, {
  refiner(node) {
    return new Keyword((node as Terminal).value.slice(2, -1));
  },
});

const comment = /\/\/.*$/m;

export function fromPEG(input: string) {
  return Parser.parse(input, peggrammar, {
    commentsModel: comment,
    // debug: true,
  });
}

const input = `
number: /\\d*\\.\\d*|\\d+/
factor: ("+" | "-")? (number | "(" expression ")")
term: factor (("*" | "/" | "%") factor)*
expression: term (("+" | "-") term)*
calc: expression EOF
`;

console.log(fromPEG(input));

// console.log(
//   JSON.stringify(Parser.parse("1 + 2 * 3", state.calc, { reduceTree: true }).reduced(true), null, 2)
// );
