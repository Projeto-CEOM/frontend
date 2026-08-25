import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "../keys";
import { alertsApi, type AlertListParams } from "../alerts";

/** Compara tudo menos `page`: mudou um filtro, o que está na tela não vale mais. */
const sameFilters = (a: AlertListParams = {}, b: AlertListParams = {}) => {
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  keys.delete("page");

  return [...keys].every(
    (key) => a[key as keyof AlertListParams] === b[key as keyof AlertListParams],
  );
};

/**
 * Listagem de alertas — só leitura, então é um `useQuery` direto em vez de
 * `createCrudQueries` (que pressupõe create/update/delete).
 *
 * O `placeholderData` é seletivo: na troca de **página** mantém as linhas
 * anteriores (sem piscar, como nas outras telas), mas na troca de **filtro**
 * devolve `undefined` — a query volta a `pending` e o `DataTable` mostra o
 * skeleton, deixando claro que está buscando em vez de exibir dados que não
 * correspondem mais ao filtro escolhido.
 */
export const useAlerts = (params?: AlertListParams) =>
  useQuery({
    queryKey: queryKeys.alerts.list(params),
    queryFn: () => alertsApi.list(params),
    placeholderData: (previous, previousQuery) => {
      if (!previous) return undefined;

      const previousParams = previousQuery?.queryKey.at(-1) as
        | AlertListParams
        | undefined;

      return sameFilters(previousParams, params) ? previous : undefined;
    },
  });

/** Como `sameFilters`, mas ignorando também a janela de tempo (ver `useReadings`). */
const sameScope = (a: AlertListParams = {}, b: AlertListParams = {}) => {
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  ["page", "from", "to"].forEach((key) => keys.delete(key));

  return [...keys].every(
    (key) => a[key as keyof AlertListParams] === b[key as keyof AlertListParams],
  );
};

/**
 * Variante para o dashboard: mesma fonte, política de cache diferente. Lá a
 * janela de tempo desliza sozinha e os cards não podem piscar por isso — só a
 * troca de sala/sensor/período justifica descartar o que está na tela.
 */
export const useAlertsSummary = (params?: AlertListParams) =>
  useQuery({
    queryKey: queryKeys.alerts.list(params),
    queryFn: () => alertsApi.list(params),
    refetchInterval: 60_000,
    placeholderData: (previous, previousQuery) => {
      if (!previous) return undefined;

      const previousParams = previousQuery?.queryKey.at(-1) as
        | AlertListParams
        | undefined;

      return sameScope(previousParams, params) ? previous : undefined;
    },
  });
