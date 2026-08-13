import api from "./client";
import { USE_MOCK_SENSORS } from "./config";
import { mockSensorsApi } from "./mock";
import type { CrudApi, Sensor, SensorPayload } from "./types";

const COLLECTION = "/api/sensors/";
const item = (id: string) => `/api/sensors/${id}`;

const httpSensorsApi: CrudApi<Sensor, SensorPayload> = {
  list: () => api.get<Sensor[]>(COLLECTION),
  get: (id) => api.get<Sensor>(item(id)),
  create: (payload) => api.post<Sensor>(COLLECTION, payload),
  update: (id, payload) => api.put<Sensor>(item(id), payload),
  remove: (id) => api.del<void>(item(id)).then(() => undefined),
};

export const sensorsApi = USE_MOCK_SENSORS ? mockSensorsApi : httpSensorsApi;

export type { Sensor, SensorPayload };
