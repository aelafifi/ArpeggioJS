# ParsingExpression

```typescript
abstract class ParsingExpression {
    // Base class for any parsing expression.
    // It contains the main options that are common for all expressions.
    // It handles the highlevel parsing logic, and the cache mechanism.

    // By default, expressions should be kept as is, and not reduced.
    // If this is set to true by any subclass, it should be reduced.
    // This is used to reduce the expression tree to a simpler form.
    // i.e. some expressions are just useless if they have only one child element
    // e.g. Sequence with only one child, or Choice with only one child.
    // I that case, that one child will be used directly instead of the parent.
    readonly preReducible: boolean = false;

    // While refining and visiting the parse-tree,
    //   by default, parse-tree nodes should be kept as is, and not reduced.
    // If this is set to true by any subclass,
    //   parse-tree nodes of this expression should be reduced.
    // For some expressions, they won't return more than one child-node at most,
    // i.e. Optional and Choice.
    // In that case, the child-node will be used directly instead of the parent.
    // NOTE: This is not considered if the expression has a refiner or a ruleName.
    readonly autoReduce: boolean = false;

    constructor(
        readonly elements: GrammarDef[],
        readonly options: PEOptions = {}
    ) {
        //
    }
}
```

> ### ParsingExpression
> Options:
> - `ruleName`: `string` _(default: `""`)_
> - `refiner`: `Function` | `SUPPRESS` | `REDUCE` _(default: `""`)_
>
> > ### Match
> > The only expressions that return `Terminal` PTNode
> >
> > Options:
> > - `ignoreCase`: `boolean` _(default: `undefined`)_
> >
> > > ### StringMatch
> > >
> >
> > > ### RegexMatch
>
> > ### SyntaxPredicate
> > Doesn't have any options, it's always suppressed, and doesn't consume
> >

-----

### skipWS

- `string`: skip any of these characters.
- `null`: don't skip whitespaces.
- `undefined`: not configured, use default `"\r\n\t "`.

### ignoreCase

- `true`: force ignore case for all rules.
- `false`: case-sensitive except for `RegExp` instances with `i` flag set explicitly.
- `undefined`: not configured, use default `false`.

### Caches:

- `ruleCache`: stores the normalized rules \
  (i.e. strings, RegExp's, arrays, or functions that are parsed to Index)
- `resultCache`: given a Index and a position, return result and next position
  if the expression succeeded matching before at this position.

## Challenge:

How to handle this?

```python
def expr():
    return Choice(Sequence(expr, "+", term), term)

def term():
    return RegExMatch(r'\d+')
```

# Elements

## Errors

### GrammarError

Normal class extends Error.

Used only when there is an expression that's not extending `ParsingExpresion`
or not convertable to it.

### NoMatch

Used when there is no match for the next rule when it's expected to match.

If it's not required to match (i.e. `Optional`), it's not an error.
It should return a `PTNode` with `null` value instead.

`NoMatch` error should provide information about the position of the error (using context format),
and what rules are expected (if set)

## Parsing Expressions

### Index

The base class of all expressions, it contains the main (generic) options:

- root: boolean _(not clear so far)_
- ruleName: string
- suppress: boolean
- visitor: (node, children) => any

Methods:

- parse(parser: Parser)
    1. log(">> Matching rule {ruleName} at position {line:col} => {context}", indent=1)
    2. Check cache
        - If cached:
            - set position to new position
            - increase cache hits
            - log("** Cache hit for {ruleName} as {line:col} = '{result}' : new_pos={line:col}")
            - log("<<+ Matched rule {ruleName} at position {line:col}")
            - if result is NOMATCH_MARKER, raise `parser.nm`, otherwise return the result
        - else:
            - increase cache misses
- mjnkbh