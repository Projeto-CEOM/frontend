import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "../keys";
import { readingsApi, type ReadingListParams } from "../readings";

/** Teto do backend por requisição — o dashboard pede tudo de uma vez. */
export const READINGS_MAX_PAGE_SIZE = 1000;

/**
 * Compara os filtros ignorando a janela de tempo. A janela desliza sozinha (o
 * dashboard reancora o `from` a cada 5 min), e isso não pode apagar o gráfico:
 * o recorte continua sendo o mesmo. Já trocar sala/sensor muda o recorte de
 * verdade, e aí o desenho antigo não vale mais.
 */
const sameScope = (a: ReadingListParams = {}, b: ReadingListParams = {}) => {
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  ["from", "to"].forEach((key) => keys.delete(key));

  return [...keys].every(
    (key) =>
      a[key as keyof ReadingListParams] === b[key as keyof ReadingListParams],
  );
};

/**
 * Série de leituras do período, para os gráficos do dashboard.
 *
 * `refetchInterval` mantém o painel vivo — é monitoramento em tempo real, o
 * ESP32 continua enviando enquanto a tela está aberta.
 */
export const useReadings = (params?: ReadingListParams) =>
  useQuery({
    queryKey: queryKeys.readings.list(params),
    queryFn: () => readingsApi.list(params),
    refetchInterval: 60_000,
    placeholderData: (previous, previousQuery) => {
      if (!previous) return undefined;

      const previousParams = previousQuery?.queryKey.at(-1) as
        | ReadingListParams
        | undefined;

      return sameScope(previousParams, params) ? previous : undefined;
    },
  });
