(function (root) {
  'use strict';
  // Well-mixed room CO2 mass balance + Rudnick & Milton (2003) rebreathed-fraction form of Wells-Riley.
  var CA = 38000; // ppm CO2 added to exhaled breath vs ambient (Rudnick & Milton 2003 use ~38,000)
  var ACTIVITY = { rest: 0.0040, seated: 0.0052, light: 0.0068, active: 0.0115 }; // L/s CO2 per adult, approximate
  function flowFromACH(ach, volM3) { return ach * volM3 * 1000 / 3600; } // L/s
  function flowFromPerPerson(lsp, n) { return lsp * n; }
  function lambda(Q, volM3) { return (Q / 1000) / volM3 * 3600; } // air changes per hour as decay rate per hour
  function steadyPpm(n, g, Q, c0) { return c0 + (n * g / Q) * 1e6; }
  // CO2 after t hours starting from c (ppm)
  function ppmAt(tHours, cStart, n, g, Q, volM3, c0) {
    var css = steadyPpm(n, g, Q, c0), lam = lambda(Q, volM3);
    return css + (cStart - css) * Math.exp(-lam * tHours);
  }
  // hours until CO2 reaches target, Infinity if steady state below target, 0 if already there
  function hoursTo(target, cStart, n, g, Q, volM3, c0) {
    var css = steadyPpm(n, g, Q, c0), lam = lambda(Q, volM3);
    if (cStart >= target) return 0;
    if (css <= target) return Infinity;
    return -Math.log((css - target) / (css - cStart)) / lam;
  }
  // mean CO2 over t hours (for risk)
  function meanPpm(tHours, cStart, n, g, Q, volM3, c0) {
    var css = steadyPpm(n, g, Q, c0), lam = lambda(Q, volM3);
    if (tHours <= 0) return cStart;
    return css + (cStart - css) * (1 - Math.exp(-lam * tHours)) / (lam * tHours);
  }
  function rebreathed(ppm, c0) { return Math.max(0, (ppm - c0) / CA); }
  // P = 1 - exp(-f * I * q * t / n); mask factor multiplies f
  function risk(f, infectors, q, tHours, n, maskFactor) {
    if (n <= 0) return 0;
    var m = maskFactor == null ? 1 : maskFactor;
    return 1 - Math.exp(-f * m * infectors * q * tHours / n);
  }
  // flow (L/s) needed to hold room at targetPpm in steady state
  function flowForTarget(target, n, g, c0) {
    if (target <= c0) return Infinity;
    return n * g * 1e6 / (target - c0);
  }
  function band(ppm) {
    if (ppm < 800) return 'good';
    if (ppm < 1000) return 'ok';
    if (ppm < 1500) return 'poor';
    return 'bad';
  }
  var api = { CA: CA, ACTIVITY: ACTIVITY, flowFromACH: flowFromACH, flowFromPerPerson: flowFromPerPerson, lambda: lambda,
    steadyPpm: steadyPpm, ppmAt: ppmAt, hoursTo: hoursTo, meanPpm: meanPpm, rebreathed: rebreathed, risk: risk, flowForTarget: flowForTarget, band: band };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.AirShare = api;
})(typeof window !== 'undefined' ? window : this);
