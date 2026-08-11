import { createContext, useContext, useState, type ReactNode } from "react";

export type Room = {
  id: string;
  name: string;
  description: string;
  tempMin: number;
  tempMax: number;
  humidityMin: number;
  humidityMax: number;
};

const initialRooms: Room[] = [
  {
    id: "seed-1",
    name: "Reserva Técnica 1",
    description: "Documentos e têxteis do acervo permanente.",
    tempMin: 18,
    tempMax: 22,
    humidityMin: 45,
    humidityMax: 55,
  },
  {
    id: "seed-2",
    name: "Sala de Exposição Permanente",
    description: "",
    tempMin: 19,
    tempMax: 23,
    humidityMin: 40,
    humidityMax: 60,
  },
  {
    id: "seed-3",
    name: "Sala de Exposição Temporária",
    description: "",
    tempMin: 19,
    tempMax: 23,
    humidityMin: 40,
    humidityMax: 60,
  },
  {
    id: "seed-4",
    name: "Reserva Técnica 2",
    description: "Objetos tridimensionais e cerâmica.",
    tempMin: 18,
    tempMax: 21,
    humidityMin: 45,
    humidityMax: 55,
  },
  {
    id: "seed-5",
    name: "Arquivo Documental",
    description: "Documentos em papel e microfilmes.",
    tempMin: 17,
    tempMax: 20,
    humidityMin: 40,
    humidityMax: 50,
  },
  {
    id: "seed-6",
    name: "Biblioteca",
    description: "",
    tempMin: 18,
    tempMax: 22,
    humidityMin: 40,
    humidityMax: 55,
  },
  {
    id: "seed-7",
    name: "Laboratório de Conservação",
    description: "Restauração e higienização de peças.",
    tempMin: 19,
    tempMax: 24,
    humidityMin: 45,
    humidityMax: 55,
  },
  {
    id: "seed-8",
    name: "Sala de Recepção",
    description: "",
    tempMin: 20,
    tempMax: 26,
    humidityMin: 40,
    humidityMax: 65,
  },
  {
    id: "seed-9",
    name: "Auditório",
    description: "",
    tempMin: 20,
    tempMax: 25,
    humidityMin: 40,
    humidityMax: 65,
  },
  {
    id: "seed-10",
    name: "Depósito de Mobiliário",
    description: "Móveis históricos de grande porte.",
    tempMin: 18,
    tempMax: 23,
    humidityMin: 45,
    humidityMax: 58,
  },
  {
    id: "seed-11",
    name: "Sala de Fotografias",
    description: "Acervo fotográfico e negativos.",
    tempMin: 16,
    tempMax: 19,
    humidityMin: 35,
    humidityMax: 45,
  },
  {
    id: "seed-12",
    name: "Acervo Têxtil",
    description: "Vestimentas e tecidos históricos.",
    tempMin: 18,
    tempMax: 21,
    humidityMin: 45,
    humidityMax: 55,
  },
  {
    id: "seed-13",
    name: "Sala de Mapas",
    description: "",
    tempMin: 18,
    tempMax: 22,
    humidityMin: 40,
    humidityMax: 50,
  },
  {
    id: "seed-14",
    name: "Sala de Numismática",
    description: "Moedas e cédulas históricas.",
    tempMin: 18,
    tempMax: 22,
    humidityMin: 40,
    humidityMax: 50,
  },
];

type RoomsContextValue = {
  rooms: Room[];
  addRoom: (room: Omit<Room, "id">) => Room;
  updateRoom: (id: string, room: Omit<Room, "id">) => void;
  removeRoom: (id: string) => void;
};

const RoomsContext = createContext<RoomsContextValue | undefined>(undefined);

export const RoomsProvider = ({ children }: { children: ReactNode }) => {
  const [rooms, setRooms] = useState<Room[]>(initialRooms);

  const addRoom = (room: Omit<Room, "id">) => {
    const newRoom: Room = { id: crypto.randomUUID(), ...room };
    setRooms((current) => [...current, newRoom]);
    return newRoom;
  };

  const updateRoom = (id: string, room: Omit<Room, "id">) => {
    setRooms((current) =>
      current.map((current_) =>
        current_.id === id ? { ...current_, ...room } : current_,
      ),
    );
  };

  const removeRoom = (id: string) => {
    setRooms((current) => current.filter((room) => room.id !== id));
  };

  return (
    <RoomsContext.Provider value={{ rooms, addRoom, updateRoom, removeRoom }}>
      {children}
    </RoomsContext.Provider>
  );
};

export const useRooms = () => {
  const context = useContext(RoomsContext);

  if (!context) {
    throw new Error("useRooms deve ser usado dentro de um RoomsProvider");
  }

  return context;
};
