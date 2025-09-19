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
