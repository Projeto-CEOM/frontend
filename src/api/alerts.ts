import api from "./client";
import type { AlertFamily, AlertListParams, AlertLog, Paginated } from "./types";

const COLLECTION = "/api/alerts/";
const item = (id: string) => `/api/alerts/${id}`;

export const alertsApi = {
  list: (params?: AlertListParams) =>
    api.get<Paginated<AlertLog>>(COLLECTION, { params }),
  get: (id: string) => api.get<AlertLog>(item(id)),
};

export type { AlertFamily, AlertListParams, AlertLog };
