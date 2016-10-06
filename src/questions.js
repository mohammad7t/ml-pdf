function N(mu, sigma){
  return (x) => Math.exp(-(x-mu)*(x-mu) / 2 / sigma / sigma);
}

export const list= [
  {from: 10, to: 50, pdf1: N(25, 5), pdf2: N(35, 5)},
  {from: 10, to: 50, pdf1: (x)=>10 / x, pdf2: (x)=>Math.pow(Math.tan(x / 200), 2)},
];