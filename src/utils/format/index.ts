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

export const DATE_INPUT_LENGTH = 10;

export const formatDateInput = (raw: string) => {
  const digits = raw.replace(/\D/g, "").slice(0, 8);
  const day = digits.slice(0, 2);
  const month = digits.slice(2, 4);
  const year = digits.slice(4, 8);

  return [day, month, year].filter(Boolean).join("/");
};

export const dateInputToISO = (value: string) => {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value);
  if (!match) return "";

  const [, day, month, year] = match;
  const date = new Date(`${year}-${month}-${day}T00:00:00`);

  const exists =
    date.getFullYear() === Number(year) &&
    date.getMonth() + 1 === Number(month) &&
    date.getDate() === Number(day);

  return exists ? `${year}-${month}-${day}` : "";
};

export const dateInputError = (value: string) =>
  value.length === DATE_INPUT_LENGTH && dateInputToISO(value) === ""
    ? "Data inválida."
    : undefined;

export const formatDateTime = (value: string | null | undefined) => {
  if (!value) return "—";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

/** "agora", "há 3 min", "há 2 h", "há 4 d" — a partir de minutos decorridos. */
export const formatElapsed = (minutes: number | null | undefined) => {
  if (minutes === null || minutes === undefined) return "sem dados";
  if (minutes < 1) return "agora";
  if (minutes < 60) return `há ${minutes} min`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `há ${hours} h`;

  return `há ${Math.floor(hours / 24)} d`;
};

/** Mesma leitura, a partir de um instante absoluto. */
export const formatElapsedSince = (
  value: string | number | null | undefined,
  now = Date.now(),
) => {
  if (value === null || value === undefined) return "sem dados";

  const time = typeof value === "number" ? value : new Date(value).getTime();
  if (Number.isNaN(time)) return "sem dados";

  return formatElapsed(Math.floor((now - time) / 60_000));
};

const ALERT_TYPE_LABELS: Record<string, string> = {
  temperature: "Temperatura",
  humidity: "Umidade",
  co2: "CO2",
};

const ALERT_STATE_LABELS: Record<string, string> = {
  high: "acima do limite",
  low: "abaixo do limite",
  ok: "normalizado",
};

const ALERT_UNITS: Record<string, string> = {
  temperature: "°C",
  humidity: "%",
  co2: "ppm",
};

const splitAlertType = (alertType: string | null) => {
  const [family, state] = (alertType ?? "").split("_");
  return { family, state };
};

export const formatAlertType = (alertType: string | null) => {
  const { family, state } = splitAlertType(alertType);
  if (!family) return "—";

  const familyLabel = ALERT_TYPE_LABELS[family] ?? family;
  const stateLabel = ALERT_STATE_LABELS[state] ?? state;

  return stateLabel ? `${familyLabel} ${stateLabel}` : familyLabel;
};

export const isAlertViolation = (alertType: string | null) =>
  splitAlertType(alertType).state !== "ok";

export const formatAlertValue = (
  alertType: string | null,
  value: number | null,
) => {
  if (value === null || value === undefined) return "—";

  const { family } = splitAlertType(alertType);
  const unit = ALERT_UNITS[family] ?? "";

  return `${value}${unit}`;
};
