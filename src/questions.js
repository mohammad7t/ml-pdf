export function N(mu, sigma) {
  return (x) => Math.exp(-(x - mu) * (x - mu) / 2 / sigma / sigma);
}

export function sum(...args) {
  args = preArgs(args);
  return (x) => args.reduce((s, f)=>s + f(x), 0);
}
function pre(f) {
  return typeof(f) === "number" ? (x) => f : f;
}
function preArgs(args) {
  return args.map(pre);
}
export function mul(...args) {
  args = preArgs(args);
  return (x) => args.reduce((s, f)=>s * f(x), 1);
}
export function l(from, to){
  return (f) => (x) => (from <= x && x <= to) ? pre(f)(x) : 0;
}

export const list = [
  {initialFrom: -20, initialTo: 0, from: -30, to: 50, pdf1: N(10, 3), pdf2: sum(N(0, 5), N(20, 5))},
  {from: -30, to: 50, pdf1: N(10, 3), pdf2: sum(N(0, 5), mul(2, N(20, 5)))},
  {from: -60, to: 80, pdf1: N(20, 15), pdf2: sum(N(-40, 5), mul(4, N(50, 5)))},
  {from: -120, to: 50, pdf1: N(10, 3), pdf2: sum(N(-100, 5), mul(20, N(60, 1)))},
  {from: 10, to: 100, pdf1: N(10, 25), pdf2: N(35,5)},
  {from: 10, to: 100, pdf1: N(50, 25), pdf2: N(30,5)},
  {from: 10, to: 100, pdf1: sum(mul(2, N(50, 15)),N(70,25)), pdf2: N(60,5)},
  {from: 10, to: 100, pdf1: N(80, 1), pdf2: x=>Math.pow(x, 1.5)},
  {from: 10, to: 100, pdf1: N(50, 1), pdf2: x=>Math.pow(x, 1.5)},
  {from: 10, to: 100, pdf1: N(30, 1), pdf2: x=>Math.pow(x, 1.5)},
];