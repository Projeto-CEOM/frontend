/**
 * Faixa "min – max" com unidade. O backend ainda pode não devolver os limites,
 * então valores ausentes viram travessão em vez de `undefined` na tela.
 */
export const formatRange = (
  min: number | undefined,
  max: number | undefined,
  unit: string,
) =>
  min === undefined || max === undefined
    ? "—"
    : `${min}${unit} – ${max}${unit}`;
