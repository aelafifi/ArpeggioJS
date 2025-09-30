import { StringMatch } from "./StringMatch";
import { MatchOptions } from "../types";
import { RegexMatch } from "./RegexMatch";
import { Keyword } from "./Keyword";

export function stringMatch(pattern: string, options?: MatchOptions) {
  return new StringMatch(pattern, options);
}

export function regexMatch(pattern: RegExp, options?: MatchOptions) {
  return new RegexMatch(pattern, options);
}

export function keyword(kw: string, options?: MatchOptions) {
  return new Keyword(kw, options);
}

export { Match } from "./Match";
export { EOF } from "./EndOfFile";
export { StringMatch, RegexMatch, Keyword };
