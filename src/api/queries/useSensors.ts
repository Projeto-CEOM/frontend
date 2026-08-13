import { queryKeys } from "../keys";
import { sensorsApi, type Sensor, type SensorPayload } from "../sensors";
import { createCrudQueries } from "./createCrudQueries";

const sensorQueries = createCrudQueries<Sensor, SensorPayload>({
  api: sensorsApi,
  keys: queryKeys.sensors,
  messages: {
    created: "Sensor cadastrado com sucesso.",
    updated: "Sensor atualizado com sucesso.",
    removed: "Sensor removido com sucesso.",
  },
});

export const {
  useList: useSensors,
  useDetail: useSensor,
  useCreate: useCreateSensor,
  useUpdate: useUpdateSensor,
  useDelete: useDeleteSensor,
} = sensorQueries;
