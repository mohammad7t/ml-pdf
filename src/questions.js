function N(mu, sigma) {
  return (x) => Math.exp(-(x - mu) * (x - mu) / 2 / sigma / sigma);
}
function sum(...args) {
  return (x) => args.reduce((s, f)=>s + f(x), 0);
}

export const list = [
  {from: -30, to: 50, pdf1: N(10, 3), pdf2: sum(N(0, 5), N(20, 5))},
  {from: 10, to: 50, pdf1: (x)=>10 / x, pdf2: (x)=>Math.pow(Math.tan(x / 200), 2)},
];