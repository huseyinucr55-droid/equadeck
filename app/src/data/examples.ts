// Our own starter equations: classic results anyone might want to typeset.
export type Example = { name: string; code: string };

export const EXAMPLES: Example[] = [
  { name: 'Quadratic formula', code: 'x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}' },
  { name: "Euler's identity", code: 'e^{i\\pi} + 1 = 0' },
  { name: 'Gaussian integral', code: '\\int_{-\\infty}^{\\infty} e^{-x^2}\\,dx = \\sqrt{\\pi}' },
  { name: 'Taylor series', code: 'f(x) = \\sum_{n=0}^{\\infty} \\frac{f^{(n)}(a)}{n!}\\,(x-a)^n' },
  { name: 'Derivative as a limit', code: "f'(x) = \\lim_{h \\to 0} \\frac{f(x+h) - f(x)}{h}" },
  { name: "Bayes' theorem", code: 'P(A \\mid B) = \\frac{P(B \\mid A)\\,P(A)}{P(B)}' },
  { name: 'Piecewise function', code: '|x| = \\begin{cases} x & \\text{if } x \\geq 0 \\\\ -x & \\text{if } x < 0 \\end{cases}' },
  { name: '2×2 determinant', code: '\\det\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix} = ad - bc' },
  { name: 'Step-by-step derivation', code: '\\begin{aligned} (a+b)^2 &= (a+b)(a+b) \\\\ &= a^2 + 2ab + b^2 \\end{aligned}' },
  { name: 'Binomial theorem', code: '(x+y)^n = \\sum_{k=0}^{n} \\binom{n}{k} x^{n-k} y^{k}' },
  { name: 'Maxwell–Faraday law', code: '\\curl{\\vb{E}} = -\\pdv{\\vb{B}}{t}' },
  { name: 'Photosynthesis', code: '\\ce{6CO2 + 6H2O ->[\\text{light}] C6H12O6 + 6O2}' },
];
