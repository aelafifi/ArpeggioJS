import { Parser } from "./parser";

export function bisectLeft(l: number[], v: number) {
  let lo = 0;
  let hi = l.length;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (l[mid] < v) lo = mid + 1;
    else hi = mid;
  }
  return lo;
}

export function indent(str: string, _indent: string | number = 2) {
  const indentStr = typeof _indent == "string" ? _indent : " ".repeat(_indent);
  return str
    .split(/\r?\n/)
    .map((line) => indentStr + line)
    .join("\n");
}

export class StringManipulation {
  static getLineCol(parser: Parser, position?: number): [number, number] {
    position ??= parser.position;
    if (parser.lineEnds.length === 0) {
      let last_line_end = parser.input.indexOf("\n");

      while (last_line_end !== -1) {
        parser.lineEnds.push(last_line_end);
        last_line_end = parser.input.indexOf("\n", last_line_end + 1);
      }
    }

    const line = bisectLeft(parser.lineEnds, position);
    let col = position;
    if (line > 0) {
      col -= parser.lineEnds[line - 1];
      if ("\n\r".includes(parser.input[parser.lineEnds[line - 1]])) {
        col--;
      }
    }

    return [line + 1, col + 1];
  }

  static getLineColStr(parser: Parser, position?: number): string {
    const [line, col] = StringManipulation.getLineCol(parser, position);
    return `${line}:${col}`;
  }

  static getContext(parser: Parser, position?: number, length?: number) {
    position = position ?? parser.position;
    const windowSize = 10;

    let retval: string;
    if (length) {
      const a = parser.input.slice(
        Math.max(position - windowSize, 0),
        position,
      );
      const b = parser.input.slice(position, position + length);
      const c = parser.input.slice(position + length, position + windowSize);
      retval = `${a}•${b}•${c}`;
    } else {
      const a = parser.input.slice(
        Math.max(position - windowSize, 0),
        position,
      );
      const b = parser.input.slice(position, position + windowSize);
      retval = `${a}•${b}`;
    }

    return retval.replace(/(?=[\r\n])\r?\n?/g, "⏎");
  }

  static atPosContext(parser: Parser, position?: number, length?: number) {
    const lineColStr = StringManipulation.getLineColStr(parser, position);
    const context = StringManipulation.getContext(parser, position, length);
    return `${lineColStr} => '${context}'`;
  }
}
