import api from "./client";
import type { CrudApi, Paginated, Reading } from "./types";

const COLLECTION = "/api/readings/";

export const readingsApi: CrudApi<Reading, {}> = {
  list: ({filters, ...params}) => api.get<Paginated<Reading>>(COLLECTION, { params: {...params, ...filters} }),
};

export type { Reading };
