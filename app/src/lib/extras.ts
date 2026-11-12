// Chemistry (mhchem) and physics macros: a separate chunk, loaded on first use
// or when the browser is idle. Importing registers the TeX packages.
import 'mathjax-full/js/input/tex/mhchem/MhchemConfiguration.js';
import 'mathjax-full/js/input/tex/physics/PhysicsConfiguration.js';

export const loaded = true;
