import { useState, useEffect } from "react";
import { X, Save } from "lucide-react";
import { useRooms } from "@/api/queries/useRooms";
import Button from "@/components/common/Button";
import type { Channel } from "@/api/types";
import { useLinkRoomToChannel, useUnlinkRoomFromChannel } from "@/api/queries/useChannels";

type RoomLinkModalProps = {
  channel: Channel | null;
  onClose: () => void;
};

const RoomLinkModal: React.FC<RoomLinkModalProps> = ({ channel, onClose }) => {
  const { data: roomsPage, isLoading: isLoadingRooms } = useRooms({ page: 1, pageSize: 200 });
  const allRooms = roomsPage?.data ?? [];

  const linkMutation = useLinkRoomToChannel();
  const unlinkMutation = useUnlinkRoomFromChannel();

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (channel?.rooms) {
      const initialIds = channel.rooms.map((room) => room.id);
      setSelectedIds(new Set(initialIds));
    }
  }, [channel]);

  const handleToggle = (roomId: string) => {
    const nextIds = new Set(selectedIds);
    if (nextIds.has(roomId)) {
      nextIds.delete(roomId);
    } else {
      nextIds.add(roomId);
    }
    setSelectedIds(nextIds);
  };

  const handleSave = async () => {
    if (!channel) return;
    setIsSaving(true);

    const originalIds = new Set(channel.rooms?.map((r) => r.id) || []);
    const currentIds = Array.from(selectedIds);

    const toLink = currentIds.filter((id) => !originalIds.has(id));
    const toUnlink = Array.from(originalIds).filter((id) => !selectedIds.has(id));

    try {
      const linkPromises = toLink.map((roomId) =>
        linkMutation.mutateAsync({ channelId: channel.id, roomId })
      );

      const unlinkPromises = toUnlink.map((roomId) =>
        unlinkMutation.mutateAsync({ channelId: channel.id, roomId })
      );

      await Promise.all([...linkPromises, ...unlinkPromises]);
      
      onClose();
    } catch (error) {
      console.error("Erro ao vincular salas", error);
    } finally {
      setIsSaving(false);
    }
  };

  if (!channel) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-xl bg-surface p-6 shadow-xl">
        <div className="flex items-center justify-between border-b border-border pb-4">
          <div>
            <h2 className="text-lg font-semibold text-ink">Vincular Salas</h2>
            <p className="text-sm text-ink-soft">Canal: {channel.name || channel.telegramId}</p>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-ink-soft hover:bg-surface-hover">
            <X size={20} />
          </button>
        </div>

        <div className="my-4 max-h-60 overflow-y-auto pr-2">
          {isLoadingRooms ? (
            <p className="text-sm text-ink-soft">Carregando salas...</p>
          ) : allRooms.length === 0 ? (
            <p className="text-sm text-ink-soft">Nenhuma sala cadastrada no sistema.</p>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {allRooms.map((room) => (
                <label
                  key={room.id}
                  className="flex cursor-pointer items-center gap-2 rounded-lg border border-border px-3 py-2 transition-colors hover:bg-surface-hover"
                >
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                    checked={selectedIds.has(room.id)}
                    onChange={() => handleToggle(room.id)}
                  />
                  <span className="truncate text-sm font-medium text-ink" title={room.name}>
                    {room.name}
                  </span>
                </label>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 border-t border-border pt-4">
          <Button variant="ghost" onClick={onClose} disabled={isSaving}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={isSaving || isLoadingRooms} icon={<Save size={16} />}>
            {isSaving ? "Salvando..." : "Salvar vínculos"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default RoomLinkModal;