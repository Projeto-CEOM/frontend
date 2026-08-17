import api from "./client";
import { USE_MOCK_SENSORS } from "./config";
import { mockSensorsApi } from "./mock";
import type { CrudApi, Sensor, SensorPayload } from "./types";

const COLLECTION = "/api/sensor/";
const item = (id: string) => `/api/sensor/${id}`;

/**
 * O backend espera `name` no corpo de create/update, mas devolve `identifier`
 * na leitura. A tradução fica isolada aqui para o resto do app continuar
 * falando só `identifier` (schema, formulário, tipos).
 */
const toRequestBody = ({ identifier, ...rest }: SensorPayload) => ({
  name: identifier,
  ...rest,
});

const httpSensorsApi: CrudApi<Sensor, SensorPayload> = {
  list: () => api.get<Sensor[]>(COLLECTION),
  get: (id) => api.get<Sensor>(item(id)),
  create: (payload) => api.post<Sensor>(COLLECTION, toRequestBody(payload)),
  update: (id, payload) => api.put<Sensor>(item(id), toRequestBody(payload)),
  remove: (id) => api.del<void>(item(id)).then(() => undefined),
};

export const sensorsApi = USE_MOCK_SENSORS ? mockSensorsApi : httpSensorsApi;

export type { Sensor, SensorPayload };
