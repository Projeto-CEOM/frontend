import api from "./client";
import type { CrudApi, Sensor, SensorPayload } from "./types";

const COLLECTION = "/api/sensor/";
const item = (id: string) => `/api/sensor/${id}`;

const toRequestBody = ({ identifier, ...rest }: SensorPayload) => ({
  name: identifier,
  ...rest,
});

export const sensorsApi: CrudApi<Sensor, SensorPayload> = {
  list: () => api.get<Sensor[]>(COLLECTION),
  get: (id) => api.get<Sensor>(item(id)),
  create: (payload) => api.post<Sensor>(COLLECTION, toRequestBody(payload)),
  update: (id, payload) => api.put<Sensor>(item(id), toRequestBody(payload)),
  remove: (id) => api.del<void>(item(id)).then(() => undefined),
};

export type { Sensor, SensorPayload };
