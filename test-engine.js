var E = require('./engine.js'), n = 0, bad = 0;
function eq(a, b, m, tol) { if (a === b) { n++; return; } n++; tol = tol == null ? 1e-9 : tol; if (!(Math.abs(a - b) <= tol)) { bad++; console.log('FAIL', m, a, b); } }
// flow conversions: 100 m3 at 2 ACH = 200 m3/h = 55.556 L/s
eq(E.flowFromACH(2, 100), 200000 / 3600, 'ach'); eq(E.flowFromPerPerson(7.1, 30), 213, 'pp');
eq(E.lambda(E.flowFromACH(3, 120), 120), 3, 'lambda = ACH');
// steady state hand examples: 30 people, 0.0052 L/s each, 10 L/s/person
eq(E.steadyPpm(30, 0.0052, 300, 400), 400 + 520, 'ss 920');
eq(E.steadyPpm(30, 0.0052, 213, 400), 400 + 30 * 0.0052 / 213 * 1e6, 'ss 7.1 L/s/p', 1e-6);
eq(E.steadyPpm(30, 0.0052, 213, 400), 1132.394, 'ss approx', 1e-2);
eq(E.steadyPpm(0, 0.0052, 50, 420), 420, 'empty');
// transient: starts at steady => stays
eq(E.ppmAt(2, 920, 30, 0.0052, 300, 200, 400), 920, 'stay');
// one time constant from outdoor start goes 63.2% of the way
var lamQ = E.flowFromACH(1, 200); var css = E.steadyPpm(20, 0.0052, lamQ, 400);
eq(E.ppmAt(1, 400, 20, 0.0052, lamQ, 200, 400), 400 + (css - 400) * (1 - Math.exp(-1)), 'tau');
eq(E.ppmAt(1000, 400, 20, 0.0052, lamQ, 200, 400), css, 'long', 1e-6);
// decay after leaving (n=0) halves the excess per ln2/lambda
eq(E.ppmAt(Math.log(2) / 2, 1400, 0, 0.0052, E.flowFromACH(2, 200), 200, 400), 900, 'halflife', 1e-6);
// hoursTo consistent with ppmAt
var h = E.hoursTo(1000, 420, 25, 0.0052, E.flowFromACH(1, 150), 150, 420);
eq(E.ppmAt(h, 420, 25, 0.0052, E.flowFromACH(1, 150), 150, 420), 1000, 'hoursTo inverse', 1e-6);
eq(E.hoursTo(1000, 420, 2, 0.0052, 100, 150, 420), Infinity, 'never');
eq(E.hoursTo(1000, 1200, 2, 0.0052, 100, 150, 420), 0, 'already');
// mean over t: between start and end, and equals end-limit css for long t
var m = E.meanPpm(1, 420, 25, 0.0052, E.flowFromACH(1, 150), 150, 420); var e1 = E.ppmAt(1, 420, 25, 0.0052, E.flowFromACH(1, 150), 150, 420);
eq(m > 420 && m < e1 ? 1 : 0, 1, 'mean between');
eq(E.meanPpm(1e6, 420, 25, 0.0052, E.flowFromACH(1, 150), 150, 420), E.steadyPpm(25, 0.0052, E.flowFromACH(1, 150), 420), 'mean long', 1e-2);
// rebreathed fraction
eq(E.rebreathed(400 + 760, 400), 0.02, 'f 2%'); eq(E.rebreathed(300, 400), 0, 'f neg');
// risk: Wells-Riley with f: 1 infector of 30, q=25/h, 1h, f=0.01 => 1-exp(-0.25/30)
eq(E.risk(0.01, 1, 25, 1, 30, 1), 1 - Math.exp(-0.01 * 25 / 30), 'risk');
eq(E.risk(0.01, 1, 25, 1, 30, 0.25), 1 - Math.exp(-0.01 * 0.25 * 25 / 30), 'risk mask');
eq(E.risk(0, 1, 25, 8, 30, 1), 0, 'no rebreathe'); eq(E.risk(0.02, 1, 25, 1, 0, 1), 0, 'n0');
// equivalence: Wells-Riley with Q from CO2 balance equals rebreathed form
var n30 = 30, g = 0.0052, Q = 300, p = 10 / 1000 / 60 * 1000; // breathing 10 L/min -> 0.1667 L/s ... generic
var ppmSS = E.steadyPpm(n30, g, Q, 400), f = E.rebreathed(ppmSS, 400);
var pBreath = g / (E.CA * 1e-6) ; // L/s of air breathed per person implied by CO2 generation
var wr = 1 - Math.exp(-1 * 25 * pBreath / Q * 1);
eq(E.risk(f, 1, 25, 1, n30, 1), wr, 'WR equivalence', 1e-9);
// required flow
eq(E.flowForTarget(800, 30, 0.0052, 400), 30 * 0.0052 * 1e6 / 400, 'need'); eq(E.flowForTarget(800, 30, 0.0052, 400), 390, 'need 390 L/s');
eq(E.flowForTarget(400, 30, 0.0052, 400), Infinity, 'inf');
// steady at required flow hits target
eq(E.steadyPpm(30, 0.0052, E.flowForTarget(800, 30, 0.0052, 400), 400), 800, 'inverse', 1e-6);
// bands
['good:799', 'ok:800', 'ok:999', 'poor:1000', 'poor:1499', 'bad:1500'].forEach(function (s) { var p = s.split(':'); eq(E.band(+p[1]) === p[0] ? 1 : 0, 1, 'band ' + s); });
// monotonic: more people => more CO2; more flow => less
for (var k = 1; k < 40; k++) { eq(E.steadyPpm(k + 1, 0.0052, 200, 420) > E.steadyPpm(k, 0.0052, 200, 420) ? 1 : 0, 1, 'mono n' + k); eq(E.steadyPpm(10, 0.0052, 100 + k * 10, 420) < E.steadyPpm(10, 0.0052, 100 + (k - 1) * 10, 420) ? 1 : 0, 1, 'mono Q' + k); }
Object.keys(E.ACTIVITY).forEach(function (a) { eq(E.ACTIVITY[a] > 0 ? 1 : 0, 1, 'act ' + a); });
console.log(n + ' assertions, ' + bad + ' failed'); process.exit(bad ? 1 : 0);
