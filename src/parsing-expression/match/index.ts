import { StringMatch } from "./StringMatch";
import { MatchOptions } from "../types";
import { RegexMatch } from "./RegexMatch";
import { Keyword } from "./Keyword";
import { DEFAULT_KEYWORD_REGEX, DEFAULT_WS } from "../../parser";

export function stringMatch(pattern: string, options?: MatchOptions) {
  return new StringMatch(pattern, options);
}

export function regexMatch(pattern: RegExp, options?: MatchOptions) {
  return new RegexMatch(pattern, options);
}

export function keyword(kw: string, options?: MatchOptions) {
  return new Keyword(kw, options);
}

export function match(
  pattern: string | RegExp,
  options?: MatchOptions & { autoKwd?: boolean },
) {
  if (pattern instanceof RegExp) {
    return regexMatch(pattern, options);
  }

  if (options?.autoKwd && DEFAULT_KEYWORD_REGEX.test(pattern)) {
    return keyword(pattern, options);
  }

  return stringMatch(pattern, options);
}

export function match$(
  pattern: string | RegExp,
  options?: MatchOptions & { autoKwd?: boolean },
) {
  return match(pattern, { ...options, suppress: true });
}

export { Match } from "./Match";
export { EOF } from "./EndOfFile";
export { StringMatch, RegexMatch, Keyword };
