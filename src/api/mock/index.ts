import { ApiError } from "../client";
import type {
  AuthSession,
  CrudApi,
  LoginPayload,
  Room,
  RoomPayload,
  Sensor,
  SensorPayload,
} from "../types";
import { seedRooms, seedSensors } from "./seeds";

/**
 * Backend em memória usado quando `VITE_USE_MOCK_API` não é `false`.
 * Mantém a mesma assinatura dos helpers HTTP, então a troca é transparente
 * para os hooks do react-query.
 */

const delay = (ms = 350) =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

const db = {
  rooms: [...seedRooms],
  sensors: [...seedSensors],
};

const notFound = (entity: string) => new ApiError(`${entity} não encontrada.`, 404);

export const mockRoomsApi: CrudApi<Room, RoomPayload> = {
  list: async () => {
    await delay();
    return [...db.rooms];
  },

  get: async (id) => {
    await delay(150);
    const room = db.rooms.find((current) => current.id === id);
    if (!room) throw notFound("Sala");
    return room;
  },

  create: async (payload) => {
    await delay();
    const room: Room = { id: crypto.randomUUID(), ...payload };
    db.rooms = [...db.rooms, room];
    return room;
  },

  update: async (id, payload) => {
    await delay();
    const room = db.rooms.find((current) => current.id === id);
    if (!room) throw notFound("Sala");

    const updated: Room = { ...room, ...payload };
    db.rooms = db.rooms.map((current) =>
      current.id === id ? updated : current,
    );
    return updated;
  },

  remove: async (id) => {
    await delay();
    db.rooms = db.rooms.filter((current) => current.id !== id);
    db.sensors = db.sensors.filter((current) => current.roomId !== id);
  },
};

export const mockSensorsApi: CrudApi<Sensor, SensorPayload> = {
  list: async () => {
    await delay();
    return [...db.sensors];
  },

  get: async (id) => {
    await delay(150);
    const sensor = db.sensors.find((current) => current.id === id);
    if (!sensor) throw notFound("Sensor");
    return sensor;
  },

  create: async (payload) => {
    await delay();
    const sensor: Sensor = { id: crypto.randomUUID(), ...payload };
    db.sensors = [...db.sensors, sensor];
    return sensor;
  },

  update: async (id, payload) => {
    await delay();
    const sensor = db.sensors.find((current) => current.id === id);
    if (!sensor) throw notFound("Sensor");

    const updated: Sensor = { ...sensor, ...payload };
    db.sensors = db.sensors.map((current) =>
      current.id === id ? updated : current,
    );
    return updated;
  },

  remove: async (id) => {
    await delay();
    db.sensors = db.sensors.filter((current) => current.id !== id);
  },
};

export const mockAuthApi = {
  login: async ({ email }: LoginPayload): Promise<AuthSession> => {
    await delay(500);

    const [name] = email.split("@");

    return {
      user: {
        id: "mock-user",
        name: name || email,
        email,
      },
      token: `mock-token-${crypto.randomUUID()}`,
    };
  },
};
