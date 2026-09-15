import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "../keys";
import { readingsApi } from "../readings";
import type { ReadingListParams, ReadingSummaryParams } from "../types";

export const READINGS_MAX_PAGE_SIZE = 1000;

const sameScope = (a: ReadingListParams = {}, b: ReadingListParams = {}) => {
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  ["from", "to", "page"].forEach((key) => keys.delete(key));

  return [...keys].every(
    (key) =>
      a[key as keyof ReadingListParams] === b[key as keyof ReadingListParams],
  );
};

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

export const useReadingsSummary = (
  params: ReadingSummaryParams,
  enabled = true,
) =>
  useQuery({
    queryKey: queryKeys.readings.summary(params),
    queryFn: () => readingsApi.summary(params),
    enabled,
  });
