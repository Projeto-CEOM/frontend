import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { X, Save, ExternalLink } from "lucide-react";
import { useRooms } from "@/api/queries/useRooms";
import { useChannel, useCreateTelegramGroup, useVerifyTelegram } from "@/api/queries/useChannels";
import Button from "@/components/common/Button";
import {
  channelSchema,
  emptyChannelValues,
  channelToFormValues,
  type ChannelFormValues,
} from "./schema";

type ChannelFormProps = {
  channelId: string | null;
  onCancel: () => void;
  onSaved: () => void;
};

const ChannelForm: React.FC<ChannelFormProps> = ({ channelId, onCancel, onSaved }) => {
  const [step, setStep] = useState<1 | 2>(1);
  const [verifyLink, setVerifyLink] = useState<string | null>(null);
  const [verifyError, setVerifyError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: channel, isLoading: isLoadingChannel } = useChannel(channelId);
  const { data: roomsPage, isLoading: isLoadingRooms } = useRooms({ page: 1, pageSize: 200 });
  const allRooms = roomsPage?.data ?? [];

  const createGroupMutation = useCreateTelegramGroup();
  const verifyMutation = useVerifyTelegram();

  const { register, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm<ChannelFormValues>({
    resolver: yupResolver(channelSchema),
    defaultValues: emptyChannelValues,
  });

  const selectedRooms = watch("roomIds") || [];

  useEffect(() => {
    if (channel) {
      reset(channelToFormValues(channel));
    }
  }, [channel, reset]);

  const handleToggleRoom = (roomId: string) => {
    const current = new Set(selectedRooms);
    if (current.has(roomId)) {
      current.delete(roomId);
    } else {
      current.add(roomId);
    }
    setValue("roomIds", Array.from(current), { shouldDirty: true });
  };

  const onSubmitData = async (values: ChannelFormValues) => {
    setIsSubmitting(true);
    setVerifyError(null);
    setVerifyLink(null);

    try {
      await createGroupMutation.mutateAsync(values);
      onSaved();
    } catch (error) {
      console.error("Erro ao criar o grupo, iniciando verificação automática...", error);
      setStep(2);
      
      try {
        const res = await verifyMutation.mutateAsync();
        if (res.link) setVerifyLink(res.link);
      } catch (err: any) {
        console.error("Erro ao gerar link de verificação", err);
        // O ApiError do client.ts injeta a mensagem do backend no err.message
        setVerifyError(err.message || "Ocorreu um erro ao gerar o link de verificação.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoadingChannel) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg rounded-xl bg-surface p-6 shadow-xl flex flex-col max-h-[90vh]">
        
        <div className="flex items-center justify-between border-b border-border pb-4 mb-4 shrink-0">
          <div>
            <h2 className="text-lg font-semibold text-ink">
              {step === 1 && (channelId ? "Editar Canal" : "Novo Canal")}
              {step === 2 && "Verificação Necessária"}
            </h2>
            <p className="text-sm text-ink-soft">
              {step === 1 && "Preencha os dados e vincule as salas."}
              {step === 2 && "Vincule o sistema ao seu usuário do Telegram."}
            </p>
          </div>
          <button onClick={onCancel} className="rounded-lg p-1.5 text-ink-soft hover:bg-surface-hover">
            <X size={20} />
          </button>
        </div>

        {step === 1 && (
          <form id="channel-form" onSubmit={handleSubmit(onSubmitData)} className="flex flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto pr-2 space-y-4">
              <div>
                <label className="block text-sm font-medium text-ink mb-1">Nome do Canal *</label>
                <input
                  type="text"
                  {...register("name")}
                  className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-ink outline-none focus:border-primary"
                  placeholder="Ex: Alertas CEOM"
                />
                {errors.name && <span className="text-xs text-danger mt-1">{errors.name.message}</span>}
              </div>

              <div>
                <label className="block text-sm font-medium text-ink mb-2">Salas Vinculadas</label>
                <div className="max-h-48 overflow-y-auto pr-2 rounded-lg border border-border p-2">
                  {isLoadingRooms ? (
                    <p className="text-sm text-ink-soft p-2">Carregando salas...</p>
                  ) : allRooms.length === 0 ? (
                    <p className="text-sm text-ink-soft p-2">Nenhuma sala cadastrada.</p>
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
                            checked={selectedRooms.includes(room.id)}
                            onChange={() => handleToggleRoom(room.id)}
                          />
                          <span className="truncate text-sm font-medium text-ink" title={room.name}>
                            {room.name}
                          </span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 border-t border-border pt-4 mt-4 shrink-0">
              <Button variant="ghost" onClick={onCancel} disabled={isSubmitting}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting} icon={<Save size={16} />}>
                {isSubmitting ? "Processando..." : "Criar Canal"}
              </Button>
            </div>
          </form>
        )}

        {step === 2 && (
          <div className="flex flex-col py-6 items-center text-center">
            {verifyMutation.isPending ? (
              <p className="text-sm text-ink-soft">Verificando dados e gerando link...</p>
            ) : verifyError ? (
              <>
                <p className="text-sm font-semibold text-danger mb-2">Não foi possível prosseguir</p>
                <p className="text-sm text-ink-soft mb-6">{verifyError}</p>
                <p className="text-xs text-ink-faint">
                  Atualize seu cadastro na aba configurações, insira seu número usado no telegram, e tente novamente.
                </p>
              </>
            ) : verifyLink ? (
              <>
                <p className="text-sm text-ink mb-6">
                  Pronto! Agora clique no botão abaixo para autorizar o sistema no Telegram. 
                  Após realizar a verificação no aplicativo, feche esta tela e tente salvar o canal novamente.
                </p>
                <a 
                  href={verifyLink} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-6 py-3 font-medium rounded-lg bg-primary text-white hover:bg-primary-hover transition-colors"
                >
                  <ExternalLink size={18} />
                  Abrir Telegram para Verificação
                </a>
              </>
            ) : null}
            
            <div className="w-full flex justify-end mt-8 border-t border-border pt-4">
              <Button variant="ghost" onClick={() => setStep(1)}>
                Já verifiquei
              </Button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default ChannelForm;