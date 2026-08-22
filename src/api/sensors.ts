import api from "./client";
import type { CrudApi, Paginated, Sensor, SensorPayload } from "./types";

const COLLECTION = "/api/sensor/";
const item = (id: string) => `/api/sensor/${id}`;

export const sensorsApi: CrudApi<Sensor, SensorPayload> = {
  list: (params) => api.get<Paginated<Sensor>>(COLLECTION, { params }),
  get: (id) => api.get<Sensor>(item(id)),
  create: (payload) => api.post<Sensor>(COLLECTION, payload),
  update: (id, payload) => api.put<Sensor>(item(id), payload),
  remove: (id) => api.del<void>(item(id)).then(() => undefined),
};

export type { Sensor, SensorPayload };
