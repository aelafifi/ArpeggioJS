import {
  EOF,
  Optional,
  RegexMatch,
  StringMatch,
} from "../src/parsing-expression";
import { Parser } from "../src/parser";

import { ZeroOrMore } from "../src/parsing-expression/repetition/ZeroOrMore";
import { SUPPRESS } from "../src/parsing-expression/constants";
import { Sequence } from "../src/parsing-expression/basic/Sequence";
import { Choice } from "../src/parsing-expression/basic/Choice";

const TRUE = new StringMatch("true", { refiner: () => true });
const FALSE = new StringMatch("false", { refiner: () => false });
const NULL = new StringMatch("null", { refiner: () => null });
const jsonString = () =>
  new Sequence(['"', new RegexMatch(/[^"]*/), '"'], {
    refiner: (value) => value[1],
  });

const jsonNumber = new RegexMatch(/-?\d+((\.\d*)?([eE][+-]?\d+)?)?/, {
  refiner: (value) => Number(value),
});

const jsonValue = () =>
  new Choice([
    jsonString,
    jsonNumber,
    jsonObject,
    jsonArray,
    TRUE,
    FALSE,
    NULL,
  ]);

const jsonArray = () =>
  new Sequence(["[", new Optional(jsonElements), "]"], {
    refiner: (value) => value[1] ?? [],
  });

const jsonElements = () =>
  new ZeroOrMore(jsonValue, {
    sep: new StringMatch(",", { refiner: SUPPRESS }),
  });

const memberDef = () =>
  new Sequence([jsonString, ":", jsonValue], {
    refiner: (value) => [value[0], value[2]],
  });

const jsonMembers = () =>
  new ZeroOrMore(memberDef, {
    sep: new StringMatch(",", { refiner: SUPPRESS }),
    refiner: (value) => Object.fromEntries(value),
  });

const jsonObject = () =>
  new Sequence(["{", new Optional(jsonMembers), "}"], {
    refiner: (value) => value[1] ?? {},
  });

const jsonFile = () =>
  new Sequence([jsonObject, EOF], { refiner: (value) => value[0] });

const input = `
    {
      "glossary": {
          "title": "example glossary",
          "GlossDiv": {
              "title": "S",
              "GlossList": 
                   {
                  "ID": "SGML",
                  "SortAs": "SGML",
                  "GlossTerm": "Standard Generalized Markup Language",
                  "TrueValue": true,
                  "FalseValue": false,
                  "Gravity": -9.8,
                  "LargestPrimeLessThan100": 97,
                  "AvogadroNumber": 6.02E23,
                  "EvenPrimesGreaterThan2": null,
                  "PrimesLessThan10" : [2,3,5,7],
                  "Acronym": "SGML",
                  "Abbrev": "ISO 8879:1986",
                  "GlossDef": "A meta-markup language, used to create markup languages such as DocBook.",
                  "GlossSeeAlso": ["GML", "XML", "markup"],
                  "EmptyDict":  {}, // lkjhb
                  "EmptyList" : []
                  }
          }
      }
    }
`;
const pTree = Parser.parse(input, jsonFile, { commentsModel: /\/\/.*$/m });
console.log(JSON.stringify(pTree.refined, null, 2));
