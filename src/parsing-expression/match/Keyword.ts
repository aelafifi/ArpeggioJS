import { RegexMatch } from "./RegexMatch";
import { MatchOptions } from "../types";
import { DEFAULT_KEYWORD_REGEX } from "../../parser";
import { GrammarError } from "../../errors";

export class Keyword extends RegexMatch {
  constructor(kw: string, options: MatchOptions = {}) {
    if (!DEFAULT_KEYWORD_REGEX.test(kw)) {
      throw new GrammarError(`Invalid keyword: ${kw}`);
    }

    super(new RegExp(kw + "\\b"), {
      ruleName: "keyword",
      ...options,
    });
  }
}
