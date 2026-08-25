import api from "./client";
import type { CrudApi, Paginated, Reading } from "./types";

const COLLECTION = "/api/readings/";

export const readingsApi: CrudApi<Reading, {}> = {
  list: (params) => api.get<Paginated<Reading>>(COLLECTION, { params }),
};

export type { Reading };