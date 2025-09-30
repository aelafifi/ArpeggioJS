import {
  and,
  choice,
  EOF,
  Epsilon,
  not,
  optional,
  sequence,
  zeroOrMore,
} from "../src/parsing-expression";
import { Parser } from "../src/parser";
import { Node, NonTerminal } from "../src/parse-tree";

const CTs = () =>
  choice(
    [
      sequence(["c", "t"], {
        // ruleName: "ct",
      }),
      sequence(["r", "y"], {
        // ruleName: "ry",
      }),
    ],
    {
      refiner: (node: Node, values: any[]) => {
        return values.join("-");
      },
    },
  );

const program = () => [
  sequence(
    [
      "b",
      choice(["x", "y", "z"], {
        refiner: (node, value) => {
          return ({ x: 1, y: 2, z: 3 } as any)[value] as number;
        },
      }),
    ],
    {
      refiner: (node, [a, b]) => {
        return a + b;
      },
    },
  ),
  Epsilon,
  and("a"),
  not("c"),
  () => ["a", "b"],
  // () => sequence(["a", " ", "b"], { lex: true }),
  CTs,
  zeroOrMore("X"),
  choice([optional("d"), optional("e")], { ruleName: "abc" }),
  EOF,
];

let input = "b x a b c t";
let pTree = Parser.parse(input, program);
// console.log(pTree.refined);
// console.log(pTree.treeStr());
// console.log(pTree.flatStr === input);

function bottomUpWalk(
  node: Node,
  visitors: Record<string, Function> = {},
): any {
  if (node.rule.refiner) {
    return node.value;
  }

  const visitor =
    visitors[node.rule.name] ??
    (node instanceof NonTerminal
      ? (_node: Node, _: any) => (node as NonTerminal)._children
      : (node: Node, value: any) => value);

  if (node instanceof NonTerminal) {
    const childrenValues = node.children
      .filter((c) => !c.rule.suppress)
      .map((child) => bottomUpWalk(child, visitors));
    return visitor(node, childrenValues);
  }

  return visitor(node, node.value);
}

console.log(
  bottomUpWalk(pTree, {
    _program: (node: any, value: any) => JSON.stringify(value),
  }),
);
