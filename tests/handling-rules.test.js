import { Parser } from "../dist/parser";
import {
  Empty,
  Keyword,
  RegexMatch,
  Sequence,
  StringMatch,
} from "../dist/parsing-expression";
import { describe, jest } from "@jest/globals";
import { GrammarError } from "../dist/errors";

describe("Successful handling", () => {
  test("Handling null as empty", () => {
    const parser = new Parser("");
    const rule = parser.getRule(null);
    expect(rule).toBeInstanceOf(Empty);
  });

  test("Handling string as string (explicitly)", () => {
    const parser = new Parser("", { autokwd: false });
    const rule = parser.getRule("token");
    expect(rule).toBeInstanceOf(StringMatch);
    expect(rule.pattern).toEqual("token");
  });

  test("Handling string as keyword (explicitly)", () => {
    const parser = new Parser("", { autokwd: true });
    const rule = parser.getRule("token");
    expect(rule).toBeInstanceOf(Keyword);
    expect(rule.pattern).toEqual(/token\b/);
  });

  test("Handling string as keyword (default)", () => {
    const parser = new Parser("");
    const rule = parser.getRule("token");
    expect(rule).toBeInstanceOf(Keyword);
    expect(rule.pattern).toEqual(/token\b/);
  });

  test("Handling string as string if keyword pattern doesn't match", () => {
    const parser = new Parser("", { autokwd: true });
    const rule = parser.getRule("1234");
    expect(rule).toBeInstanceOf(StringMatch);
    expect(rule.pattern).toEqual("1234");
  });

  test("Handling regex as RegexMatch", () => {
    const parser = new Parser("");
    const rule = parser.getRule(/token/);
    expect(rule).toBeInstanceOf(RegexMatch);
    expect(rule.pattern).toEqual(/token/);
  });

  test("Handling list as Sequence", () => {
    const parser = new Parser("");
    const rule = parser.getRule(["a", "b", "c"]);
    expect(rule).toBeInstanceOf(Sequence);
    expect(rule.elements).toEqual(["a", "b", "c"]);
  });

  test("Handling function", () => {
    const parser = new Parser("");
    const rule = parser.getRule(() => ["a", "b", "c"]);
    expect(rule).toBeInstanceOf(Sequence);
    expect(rule.elements).toEqual(["a", "b", "c"]);
  });

  test("Handling nested function", () => {
    const parser = new Parser("");
    const rule = parser.getRule(() => () => ["a", "b", "c"]);
    expect(rule).toBeInstanceOf(Sequence);
    expect(rule.elements).toEqual(["a", "b", "c"]);
  });

  test("Handling deep nested function", () => {
    const parser = new Parser("");
    const rule = parser.getRule(() => () => () => ["a", "b", "c"]);
    expect(rule).toBeInstanceOf(Sequence);
    expect(rule.elements).toEqual(["a", "b", "c"]);
  });
});

describe("Failing handling", () => {
  const parser = new Parser("");

  test("numbers are not convertable", () => {
    expect(() => parser.getRule(123)).toThrow(GrammarError);
    expect(() => parser.getRule(123.456)).toThrow(GrammarError);
  });

  test("booleans are not convertable", () => {
    expect(() => parser.getRule(true)).toThrow(GrammarError);
    expect(() => parser.getRule(false)).toThrow(GrammarError);
  });

  test("objects are not convertable", () => {
    expect(() => parser.getRule({})).toThrow(GrammarError);
    expect(() => parser.getRule({ length: 10 })).toThrow(GrammarError);
  });

  test("undefined is not convertable", () => {
    expect(() => parser.getRule(undefined)).toThrow(GrammarError);
  });
});

describe("Rules caching", () => {
  test("Handle caching", () => {
    const parser = new Parser("");

    const mock = jest.fn(() => [1, 2, 3]);

    parser.getRule(mock);
    parser.getRule(mock);
    parser.getRule(mock);

    expect(mock).toHaveBeenCalledTimes(1);
  });
});
