import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { MessageSquare, Save, Type } from "lucide-react";
import {
  useCreateChannel,
  useChannel,
  useUpdateChannel,
} from "@/api/queries/useChannels";
import RecordForm, {
  type RecordFormField,
} from "@/components/common/RecordForm";
import {
  emptyChannelValues,
  channelSchema,
  channelToFormValues,
  type ChannelFormValues,
} from "./schema";

type ChannelFormProps = {
  channelId: string | null;
  onCancel: () => void;
  onSaved: () => void;
};

const ChannelForm: React.FC<ChannelFormProps> = ({
  channelId,
  onCancel,
  onSaved,
}) => {
  const { data: channel, isLoading } = useChannel(channelId);
  const createChannel = useCreateChannel();
  const updateChannel = useUpdateChannel();

  const form = useForm<ChannelFormValues>({
    resolver: yupResolver(channelSchema),
    defaultValues: emptyChannelValues,
  });

  const { reset } = form;

  useEffect(() => {
    if (channel) reset(channelToFormValues(channel));
  }, [channel, reset]);

  const handleSubmit = (values: ChannelFormValues) => {
    if (channelId) {
      updateChannel.mutate({ id: channelId, payload: values });
    } else {
      createChannel.mutate(values);
    }
    
    onSaved();
  };

  const fields: RecordFormField<ChannelFormValues>[] = [
    {
      name: "telegramId",
      label: "ID do Telegram",
      icon: MessageSquare,
      placeholder: "Ex: -100123456789",
      required: true,
    },
    {
      name: "name",
      label: "Nome do Canal",
      icon: Type,
      placeholder: "Ex: Alertas TI",
      required: false,
    },
  ];

  return (
    <RecordForm
      title={channelId ? "Editar canal" : "Cadastrar canal"}
      subtitle="Configure o canal ou grupo do Telegram para receber alertas."
      form={form}
      fields={fields}
      isLoading={Boolean(channelId) && isLoading}
      submitLabel={channelId ? "Salvar alterações" : "Salvar canal"}
      submitIcon={<Save size={16} strokeWidth={1.8} />}
      onSubmit={handleSubmit}
      onCancel={onCancel}
    />
  );
};

export default ChannelForm;