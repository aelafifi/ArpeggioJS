import { And, EOF, Not, Optional } from "../src/parsing-expression";
import { Parser } from "../src/parser";
import { Sequence } from "../src/parsing-expression/basic/Sequence";

const a = () => b;
const b = () => b;

const x = new Parser("");
x.getRule(a);
