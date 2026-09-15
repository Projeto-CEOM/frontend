import api from "./client";
import type {
  Paginated,
  ReadingListParams,
  ReadingSummaryParams,
  ReadingSummaryResponse,
  SensorReading,
} from "./types";

const COLLECTION = "/api/readings/";
const SUMMARY = "/api/readings/summary";

export const readingsApi = {
  list: (params?: ReadingListParams) =>
    api.get<Paginated<SensorReading>>(COLLECTION, { params }),
  summary: (params?: ReadingSummaryParams) =>
    api.get<ReadingSummaryResponse>(SUMMARY, { params }),
};

export type {
  ReadingGranularity,
  ReadingListParams,
  ReadingSummary,
  ReadingSummaryMeta,
  ReadingSummaryParams,
  SensorReading,
} from "./types";
