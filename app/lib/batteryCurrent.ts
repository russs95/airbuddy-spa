// Battery current sign — the one place the dashboard converts it.
//
// airOS sends `values.ina_current_ma` as the INA219's raw reading: NEGATIVE
// while the pack charges, POSITIVE while the XIAO draws from it (the shared
// turtleOS/airOS data dictionary, docs/wrangler/README.md in turtleOS).
// The API and the packet table keep that raw value; the "+ charging" current
// chart uses the charge current below instead: positive = charging.
// Mirrors turtleOS INA219.charge_ma() and hopeTurtles.org chargeMaFromIna().

/** Raw `ina_current_ma` → charge current in mA (positive = charging). */
export const chargeMaFromIna = (inaCurrentMa: number): number =>
  inaCurrentMa === 0 ? 0 : -inaCurrentMa

/** Same, over a trend column (nulls kept). */
export const chargeMasFromIna = (col: (number | null)[] | undefined): (number | null)[] =>
  (col ?? []).map(v => (v == null ? null : chargeMaFromIna(Number(v))))
