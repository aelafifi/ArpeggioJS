import {
  Choice,
  EOF,
  Optional,
  RegexMatch,
  Sequence,
  StringMatch,
  ZeroOrMore,
} from "../dist/parsing-expression";
import { Parser } from "../dist/ctx";
import { jest } from "@jest/globals";
import { NoMatch } from "../dist/errors";

const TRUE = "true";
const FALSE = "false";
const NULL = "null";
const jsonString = () =>
  new Sequence(
    [
      new StringMatch('"', { suppress: true }),
      new RegexMatch(/[^"]*/, { ruleName: "STRING" }),
      new StringMatch('"', { suppress: true }),
    ],
    { ruleName: "JsonString" },
  );
const jsonNumber = /-?\d+((\.\d*)?([eE][+-]?\d+)?)?/;
const jsonValue = () =>
  new Choice(
    [jsonString, jsonNumber, jsonObject, jsonArray, TRUE, FALSE, NULL],
    {
      ruleName: "JsonValue",
    },
  );
const jsonArray = () =>
  new Sequence(["[", new Optional(jsonElements), "]"], {
    ruleName: "JsonArray",
  });
const jsonElements = () =>
  new Sequence([jsonValue, new ZeroOrMore([",", jsonValue])], {
    ruleName: "JsonElements",
  });
const memberDef = () =>
  new Sequence([jsonString, ":", jsonValue], { ruleName: "MemberDef" });
const jsonMembers = () =>
  new Sequence([memberDef, new ZeroOrMore([",", memberDef])], {
    ruleName: "JsonMembers",
  });
const jsonObject = () =>
  new Sequence(["{", new Optional(jsonMembers), "}"], {
    ruleName: "JsonObject",
  });
const jsonFile = () =>
  new Sequence([jsonObject, EOF], { ruleName: "JsonFile" });

describe("testing index file", () => {
  test("empty string should result in zero", () => {
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

    const pt = Parser.parse(input, jsonFile, {
      commentsModel: /\/\/.*$/m,
    });
    expect(pt.flatStr).toStrictEqual(input);
  });

  test("test 2", () => {
    const input = `
           {
            "a": 1,
            "b": 2,
            "c": 3,
           }
        `;

    const passed = jest.fn();
    const failed = jest.fn();

    try {
      Parser.parse(input, jsonFile);
      passed();
    } catch (e) {
      expect(e).toBeInstanceOf(NoMatch);
      expect(e.position).toEqual(85);
      failed();
    }

    expect(passed).not.toHaveBeenCalled();
    expect(failed).toHaveBeenCalled();
  });

  test("test 3", () => {
    const parser = new Parser("");
    const rule = parser.getRule([1, 2, 3]);
    expect(rule).toBeInstanceOf(Sequence);
    expect(rule.elements).toHaveLength(3);
  });
});

test.each([
  { a: 1, b: 1, expected: 2 },
  { a: 1, b: 2, expected: 3 },
  { a: 2, b: 1, expected: 3 },
])(".add($a, $b)", ({ a, b, expected }) => {
  expect(a + b).toBe(expected);
});
