function bisectLeft(l: number[], v: number) {
  let lo = 0;
  let hi = l.length;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (l[mid] < v) lo = mid + 1;
    else hi = mid;
  }
  return lo;
}

export class InputString extends String {
  readonly lineEnds: number[] = [];

  constructor(
    str: string,
    public useCliColors: boolean = false,
  ) {
    super(str);

    let last_line_end = str.indexOf("\n");

    while (last_line_end !== -1) {
      this.lineEnds.push(last_line_end);
      last_line_end = str.indexOf("\n", last_line_end + 1);
    }
  }

  positionToLineCol(position: number): [number, number] {
    if (position < 0 || position > this.length) {
      throw new Error(`Position ${position} out of range [0, ${this.length}]`);
    }

    const line = bisectLeft(this.lineEnds, position);
    let col = position;
    if (line > 0) {
      col -= this.lineEnds[line - 1];
      if ("\n\r".includes(this[this.lineEnds[line - 1]])) {
        col--;
      }
    }

    return [line + 1, col + 1];
  }

  lineColToPosition(line: number, col: number): number {
    if (line < 1 || col < 1) {
      throw new Error(`Line and column numbers should be >= 1`);
    }

    if (line > this.lineEnds.length + 1) {
      throw new Error(
        `Line number ${line} out of range [1, ${this.lineEnds.length + 1}]`,
      );
    }

    let position = col - 1;
    if (line > 1) {
      position += this.lineEnds[line - 2] + 1;
    }

    if (position > this.length) {
      throw new Error(
        `Column number ${col} out of range [1, ${this.length - (line > 1 ? this.lineEnds[line - 2] + 1 : 0) + 1}]`,
      );
    }

    return position;
  }

  atPositionString(position: number): string {
    const [line, col] = this.positionToLineCol(position);
    return `at line ${line}, column ${col}`;
  }

  getContext(
    position: number,
    length?: number,
    windowSize: number = 10,
  ): string {
    const norm = (value: string) => value.replace(/(?=[\r\n])\r?\n?/g, "⏎");

    if (length) {
      const a = this.slice(Math.max(position - windowSize, 0), position);
      const b = this.slice(position, position + length);
      const c = this.slice(position + length, position + length + windowSize);
      const start = this.useCliColors ? "\x1b[43m" : "•";
      const end = this.useCliColors ? "\x1b[0m" : "•";
      return norm(`${a}${start}${b}${end}${c}`);
    }

    const a = this.slice(Math.max(position - windowSize, 0), position);
    const b = this.slice(position, position + windowSize);
    const point = this.useCliColors ? "\x1b[43m \x1b[0m" : "•";
    return norm(`${a}${point}${b}`);
  }
}
