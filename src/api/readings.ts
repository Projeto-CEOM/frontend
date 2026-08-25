import api from "./client";
import type { Paginated, ReadingListParams, SensorReading } from "./types";

// Só leitura no front: quem escreve aqui é o ESP32, via `x-api-key`.
const COLLECTION = "/api/readings/";

export const readingsApi = {
  list: (params?: ReadingListParams) =>
    api.get<Paginated<SensorReading>>(COLLECTION, { params }),
};

export type { ReadingListParams, SensorReading };
