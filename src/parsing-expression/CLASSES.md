|                      | Class Name          | arg0                        | arg1                                         | Notes                                             |
|----------------------|---------------------|-----------------------------|----------------------------------------------|---------------------------------------------------|
| `abstract`           | `ParsingExpression` | `elements: GrammarDef[]`    | `options?: PEOptions`                        |                                                   |
|                      | `Expression`        | `element: GrammarDef`       | `options?: Omit<PEOptions, "refiner">`       |                                                   |
|                      | `Sequence`          | `elements: GrammarDef[]`    | `options?: PEOptions & HasSep`               |                                                   |
|                      | `Partial`           | `elements: GrammarDef[]`    | `options?: PEOptions & HasSep`               |                                                   |
|                      | `Choice`            | `elements: GrammarDef[]`    | `options?: PEOptions`                        |                                                   |
|                      | `Repetition`        | `element: GrammarDef`       | `options: PEOptions & HasSep & HasBoundries` |                                                   |
|                      | `Optional`          | `element: GrammarDef`       | `options: PEOptions`                         |                                                   |
|                      | `ZeroOrMore`        | `element: GrammarDef`       | `options: PEOptions & HasSep`                |                                                   |
|                      | `OneOrMore`         | `element: GrammarDef`       | `options: PEOptions & HasSep`                |                                                   |
| `abstract`           | `Match`             | `pattern: string \| RegExp` | `options?: MatchOptions`                     |                                                   |
|                      | `StringMatch`       | `pattern: string`           | `options?: MatchOptions`                     |                                                   |
|                      | `RegexMatch`        | `pattern: RegExp`           | `options?: MatchOptions`                     |                                                   |
|                      | `Keyword`           | `pattern: string`           | `options?: MatchOptions`                     |                                                   |
| Singleton: `EOF`     | `EndOfFile`         |                             |                                              |                                                   |
| `abstract`           | `SyntaxPredicate`   | `element: GrammarDef`       |                                              | Forced: `suppress=true`                           |
|                      | `And`               | `element: GrammarDef`       |                                              | Forced: `suppress=true`                           |
|                      | `Not`               | `element: GrammarDef`       |                                              | Forced: `suppress=true`                           |
| Singleton: `Epsilon` | `Empty`             |                             |                                              | Forced: `suppress=true`                           |
