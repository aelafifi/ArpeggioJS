import { And, EOF, Not, Optional, Sequence } from "../src/parsing-expression";
import { Parser } from "../src/parser";

const program = () => [
  "b",
  new And("a"),
  new Not("c"),
  new Sequence(["a", "b"], {
    refiner(children: any[]) {
      return children.join("..");
    },
  }),
  ["c"],
  new Sequence(["c"], {
    ruleName: "xxx",
  }),
  new Optional("d"),
  EOF,
];

let input = "  b   a b c c ";
let pTree = Parser.parse(input, program);
console.log(pTree.refined);
// console.log(pTree.treeStr());
// console.log(pTree.flatStr === input);
