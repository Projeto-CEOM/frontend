import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Plus, Trash2, Pencil, Link } from "lucide-react";
import { useChannels, useDeleteChannel } from "@/api/queries/useChannels";
import type { Channel } from "@/api/channels";
import Button from "@/components/common/Button";
import DataTable, { type DataTableColumn } from "@/components/common/DataTable";
import { usePermissions } from "@/hooks/UsePermissions";
import ChannelForm from "./ChannelForm";

const PAGE_SIZE = 10;

const Channels: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const pageParam = Number(searchParams.get("page"));
  const page = Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1;

  const { data, isLoading, isError, error } = useChannels({
    page,
    pageSize: PAGE_SIZE,
  });
  
  const channels = data?.data ?? [];
  const meta = data?.meta;

  const deleteChannel = useDeleteChannel();
  const { can } = usePermissions();

  const formParam = searchParams.get("channel");
  const isFormOpen = formParam !== null;
  const editingChannelId = formParam && formParam !== "novo" ? formParam : null;
  const formAllowed = isFormOpen && (editingChannelId ? can("u") : can("c"));

  const openForm = (channel?: Channel) => {
    const next = new URLSearchParams(searchParams);
    next.set("channel", channel ? channel.id : "novo");
    setSearchParams(next);
  };

  const closeForm = () => {
    const next = new URLSearchParams(searchParams);
    next.delete("channel");
    setSearchParams(next);
  };

  const goToPage = (nextPage: number) => {
    const next = new URLSearchParams(searchParams);
    next.set("page", String(nextPage));
    setSearchParams(next);
  };

  const totalPages = meta?.totalPages;
  useEffect(() => {
    if (totalPages !== undefined && totalPages > 0 && page > totalPages) {
      setSearchParams(
        (current) => {
          const next = new URLSearchParams(current);
          next.set("page", String(totalPages));
          return next;
        },
        { replace: true },
      );
    }
  }, [totalPages, page, setSearchParams]);

  const handleSaved = closeForm;

  const openLinkModal = (channelId: string) => {
    console.log("Abrir modal de vinculação de salas para o canal", channelId);
  };

  useEffect(() => {
    if (isFormOpen && !formAllowed) closeForm();
  }, [isFormOpen, formAllowed]);

  if (isFormOpen) {
    if (!formAllowed) return null;
    return (
      <ChannelForm
        channelId={editingChannelId}
        onCancel={closeForm}
        onSaved={handleSaved}
      />
    );
  }

  const columns: DataTableColumn<Channel>[] = [
    {
      header: "ID do Telegram",
      align: "left",
      width: "25%",
      render: (channel) => (
        <span className="font-medium text-ink">{channel.telegramId}</span>
      ),
    },
    {
      header: "Nome do Canal",
      align: "left",
      width: "30%",
      render: (channel) => (
        <span className="text-ink-soft">{channel.name || "-"}</span>
      ),
    },
    {
      header: "Salas Vinculadas",
      align: "left",
      width: "25%",
      render: (channel) => (
        <span className="text-ink-soft">
          {channel.rooms && channel.rooms.length > 0
            ? channel.rooms.map((r) => r.name).join(", ")
            : "Nenhuma sala"}
        </span>
      ),
    },
    ...(can("u") || can("d")
      ? [
          {
            header: "Ações",
            align: "center" as const,
            width: "20%",
            render: (channel: Channel) => (
              <div className="flex items-center justify-center gap-1">
                {can("u") && (
                  <>
                    <button
                      type="button"
                      onClick={() => openLinkModal(channel.id)}
                      aria-label={`Vincular salas a ${channel.name || channel.telegramId}`}
                      className="rounded-lg p-1.5 text-ink-faint transition-colors hover:bg-primary/10 hover:text-primary"
                    >
                      <Link size={16} strokeWidth={1.8} />
                    </button>
                    <button
                      type="button"
                      onClick={() => openForm(channel)}
                      aria-label={`Editar ${channel.name || channel.telegramId}`}
                      className="rounded-lg p-1.5 text-ink-faint transition-colors hover:bg-primary/10 hover:text-primary"
                    >
                      <Pencil size={16} strokeWidth={1.8} />
                    </button>
                  </>
                )}
                {can("d") && (
                  <button
                    type="button"
                    onClick={() => {
                        if(confirm("Deseja remover este canal?")) {
                            deleteChannel.mutate(channel.id);
                        }
                    }}
                    aria-label={`Remover ${channel.name || channel.telegramId}`}
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
          <h1 className="text-2xl font-semibold text-ink">Canais Telegram</h1>
          <p className="mt-1 text-sm text-ink-soft">
            Gerenciamento de canais para recebimento de alertas do sistema.
          </p>
        </div>
        {can("c") && (
          <Button
            icon={<Plus size={16} strokeWidth={1.8} />}
            onClick={() => openForm()}
          >
            Novo Canal
          </Button>
        )}
      </div>
      
      
      <div className="mt-6">
        <DataTable
          columns={columns}
          data={channels}
          getRowKey={(channel) => channel.id}
          onPageChange={goToPage}
          pagination={meta}
          isLoading={isLoading}
          skeletonRows={Math.min(PAGE_SIZE, 5)}
          emptyMessage="Nenhum canal cadastrado ainda."
        />
      </div>
    </div>
  );
};

export default Channels;