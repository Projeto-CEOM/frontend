import api from "./client";
import type { Paginated, ReadingListParams, SensorReading } from "./types";

const COLLECTION = "/api/readings/";

export const readingsApi = {
  list: (params?: ReadingListParams) =>
    api.get<Paginated<SensorReading>>(COLLECTION, { params }),
};

export type { ReadingListParams, SensorReading };
