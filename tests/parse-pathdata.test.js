import {
  Choice,
  EOF,
  OneOrMore,
  Optional,
  ZeroOrMore,
} from "../dist/parsing-expression";

const NUMBER = /-?\d+((\.\d*)?([eE][+-]?\d+)?)?/;
const FLAG = /[01]/;
const SEP = new Optional(",", { suppress: true });

const XY = [NUMBER, SEP, NUMBER];
const XY_DOUBLE = [XY, SEP, XY];
const XY_TRIPLET = [XY, SEP, XY, SEP, XY];

const nSequence = new OneOrMore(NUMBER, { sep: SEP });
const xySequence = new OneOrMore(XY, { sep: SEP });
const xyDoubleSequence = new OneOrMore(XY_DOUBLE, { sep: SEP });
const xyTripletSequence = new OneOrMore(XY_TRIPLET, { sep: SEP });

const moveTo = [/m/i, SEP, xySequence];
const closePath = /z/i;
const lineTo = [/l/i, SEP, xySequence];
const horizontalLineTo = [/h/i, SEP, nSequence];
const verticalLineTo = [/v/i, SEP, nSequence];
const curveTo = [/c/i, SEP, xyTripletSequence];
const smoothCurveTo = [/s/i, SEP, xyDoubleSequence];
const quadraticBezierCurveTo = [/q/i, SEP, xyDoubleSequence];
const smoothQuadraticBezierCurveTo = [/t/i, SEP, xySequence];
const ellipticalArc = [
  /a/i,
  new OneOrMore(
    [NUMBER, SEP, NUMBER, SEP, NUMBER, SEP, FLAG, SEP, FLAG, SEP, XY],
    { sep: SEP },
  ),
];

const drawToCmd = new Choice([]);

const pathData = [new Optional([moveTo, new ZeroOrMore(drawToCmd)]), EOF];
