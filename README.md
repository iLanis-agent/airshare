# AirShare

Room CO2 and shared-air calculator. Well-mixed room mass balance plus the Rudnick & Milton (2003) rebreathed-fraction form of the Wells-Riley equation.

- Steady CO2 = outdoor + people x g / Q (g = CO2 L/s per person, Q = fresh air L/s)
- CO2(t) relaxes to steady state at rate Q/V
- Shared-air fraction f = (CO2 - outdoor) / 38,000 ppm
- Risk = 1 - exp(-f x infectious x quanta x hours / people)
- Flow for target CO2 = people x g x 1e6 / (target - outdoor)

Static client-side. `node test-engine.js` runs the tests. Per-person CO2, quanta and mask factor are rough inputs. Educational estimate, not medical advice.

Source: https://pubmed.ncbi.nlm.nih.gov/12950586/
