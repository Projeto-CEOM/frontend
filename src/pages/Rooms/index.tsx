import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Plus, Trash2, Pencil } from "lucide-react";
import { useDeleteRoom, useRooms } from "@/api/queries/useRooms";
import type { Room } from "@/api/rooms";
import Button from "@/components/common/Button";
import DataTable, { type DataTableColumn } from "@/components/common/DataTable";
import { usePermissions } from "@/hooks/UsePermissions";
import { formatRange } from "@/utils/format";
import RoomForm from "./RoomForm";

const PAGE_SIZE = 10;

const Rooms: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { data: rooms = [], isLoading, isError, error } = useRooms();
  const deleteRoom = useDeleteRoom();
  const { can } = usePermissions();

  const formParam = searchParams.get("sala");
  const isFormOpen = formParam !== null;
  const editingRoomId = formParam && formParam !== "nova" ? formParam : null;
  const formAllowed = isFormOpen && (editingRoomId ? can("u") : can("c"));

  const pageParam = Number(searchParams.get("page"));
  const page = Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1;

  const openForm = (room?: Room) => {
    const next = new URLSearchParams(searchParams);
    next.set("sala", room ? room.id : "nova");
    setSearchParams(next);
  };

  const closeForm = () => {
    const next = new URLSearchParams(searchParams);
    next.delete("sala");
    setSearchParams(next);
  };

  const goToPage = (nextPage: number) => {
    const next = new URLSearchParams(searchParams);
    next.set("page", String(nextPage));
    setSearchParams(next);
  };

  const handleSaved = (created: boolean) => {
    const next = new URLSearchParams(searchParams);
    next.delete("sala");
    if (created) {
      next.set("page", String(Math.ceil((rooms.length + 1) / PAGE_SIZE)));
    }
    setSearchParams(next);
  };

  useEffect(() => {
    if (isFormOpen && !formAllowed) closeForm();
  }, [isFormOpen, formAllowed]);

  if (isFormOpen) {
    if (!formAllowed) return null;

    return (
      <RoomForm
        roomId={editingRoomId}
        onCancel={closeForm}
        onSaved={handleSaved}
      />
    );
  }

  const columns: DataTableColumn<Room>[] = [
    {
      header: "Nome",
      align: "left",
      width: "25%",
      render: (room) => (
        <span className="font-medium text-ink">{room.name}</span>
      ),
    },
    {
      header: "Descrição",
      align: "left",
      width: "35%",
      render: (room) => (
        <span className="text-ink-soft">
          {room.description || "Sem descrição"}
        </span>
      ),
    },
    {
      header: "Temperatura",
      align: "center",
      width: "15%",
      render: (room) => (
        <span className="text-ink-soft">
          {formatRange(room.tempMin, room.tempMax, "°C")}
        </span>
      ),
    },
    {
      header: "Umidade",
      align: "center",
      width: "15%",
      render: (room) => (
        <span className="text-ink-soft">
          {formatRange(room.humidityMin, room.humidityMax, "%")}
        </span>
      ),
    },
    ...(can("u") || can("d")
      ? [
          {
            header: "Ações",
            align: "center" as const,
            width: "10%",
            render: (room: Room) => (
              <div className="flex items-center justify-center gap-1">
                {can("u") && (
                  <button
                    type="button"
                    onClick={() => openForm(room)}
                    aria-label={`Editar ${room.name}`}
                    className="rounded-lg p-1.5 text-ink-faint transition-colors hover:bg-primary/10 hover:text-primary"
                  >
                    <Pencil size={16} strokeWidth={1.8} />
                  </button>
                )}
                {can("d") && (
                  <button
                    type="button"
                    onClick={() => deleteRoom.mutate(room.id)}
                    aria-label={`Remover ${room.name}`}
                    className="rounded-lg p-1.5 text-ink-faint transition-colors hover:bg-danger-soft hover:text-danger"
                  >
                    <Trash2 size={16} strokeWidth={1.8} />
                  </button>
                )}
              </div>
            ),
          },
        ]
      : []),
  ];

  return (
    <div className="px-6 py-10 md:px-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-ink">Salas</h1>
          <p className="mt-1 text-sm text-ink-soft">
            Pontos de monitoramento cadastrados.
          </p>
        </div>

        {can("c") && (
          <Button
            icon={<Plus size={16} strokeWidth={1.8} />}
            onClick={() => openForm()}
          >
            Nova sala
          </Button>
        )}
      </div>

      {/* Falha só aparece quando não há nada em tela; revalidações em
          segundo plano não interrompem a listagem já carregada. */}
      {isError && rooms.length === 0 && (
        <p className="mt-6 rounded-lg bg-danger-soft px-3 py-2 text-sm font-medium text-danger">
          {error.message}
        </p>
      )}

      <div className="mt-6">
        <DataTable
          columns={columns}
          data={rooms}
          getRowKey={(room) => room.id}
          page={page}
          onPageChange={goToPage}
          pageSize={PAGE_SIZE}
          isLoading={isLoading}
          emptyMessage="Nenhuma sala cadastrada ainda."
        />
      </div>
    </div>
  );
};

export default Rooms;
