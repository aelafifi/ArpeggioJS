import {
  and,
  choice,
  Choice,
  EOF,
  Epsilon,
  Expression,
  not,
  Optional,
  optional,
  sequence,
  zeroOrMore,
} from "../src/parsing-expression";
import { Parser } from "../src/parser";
import { NonTerminal, PTNode, Terminal } from "../src/parse-tree";

const CTs = () =>
  choice([
    sequence(["c", "t"], {
      // ruleName: "ct",
    }),
    sequence(["r", "y"], {
      // ruleName: "ry",
    }),
  ]);

const program = () => [
  "b",
  Epsilon,
  and("a"),
  not("c"),
  () => ["a", "b"],
  // () => sequence(["a", " ", "b"], { lex: true }),
  CTs,
  zeroOrMore("X"),
  choice([optional("d"), optional("e")]),
  EOF,
];

let input = "b a b c t";
let pTree = Parser.parse(input, program);
// console.log(pTree.refined);
// console.log(pTree.treeStr());
// console.log(pTree.flatStr === input);

function getVisitor(
  node: PTNode,
  visitors: Record<string, Function>,
): Function {
  console.log(
    "Looking for visitor of `%s` of type %s",
    node.rule.name,
    node.rule.constructor.name,
  );
  if (visitors[node.rule.name]) {
    console.log("  -> Found user-defined visitor function.");
    return visitors[node.rule.name];
  }

  if (node.rule instanceof Choice || node.rule instanceof Expression) {
    console.log("  -> Reduce Choice/Expression PE types.");
    return (node: PTNode, values: any[]) => values[0];
  }

  if (node instanceof NonTerminal && node.children.length === 0) {
    console.log("  -> Reduce no-content NonTerminal to null.");
    return () => null;
  }

  if (node.rule instanceof Optional) {
    if ((node as NonTerminal).children.length > 0) {
      console.log("  -> Reduce Optional PE type to it's contained value.");
      return (node: PTNode, values: any[]) => values[0];
    }

    console.log("  -> Reduce empty Optional PE type to null.");
    return () => null;
  }

  console.log("  -> No visitor found, return value as-is.");
  return (node: PTNode, value: any) => value;
}

function bottomUpWalk(
  node: PTNode,
  visitors: Record<string, Function> = {},
): any {
  const visitor = getVisitor(node, visitors);
  if (node instanceof NonTerminal) {
    const v = node.children
      .filter((c) => !c.rule.suppress)
      .map((child) => bottomUpWalk(child, visitors));
    return visitor ? visitor(node, v) : node;
  }

  return visitor(node, (node as Terminal).value);
}

console.log(bottomUpWalk(pTree));
