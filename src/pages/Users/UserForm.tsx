import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { AtSign, KeyRound, Mail, Save, ShieldCheck, User as UserIcon } from "lucide-react";
import { useCreateUser, useUpdateUser, useUser } from "@/api/queries/useUsers";
import RecordForm, {
  type RecordFormField,
} from "@/components/common/RecordForm";
import { usePermissions } from "@/hooks/UsePermissions";
import { useAuth } from "@/hooks/UseAuth";
import { ROLE_LABELS, canManageRole, manageableRoles } from "@/utils/permissions";
import {
  MIN_PASSWORD_LENGTH,
  accountTenant,
  emptyUserValues,
  makeUserSchema,
  userToFormValues,
  type UserFormValues,
} from "./schema";

type UserFormProps = {
  userId: string | null;
  onCancel: () => void;
  onSaved: () => void;
};

const UserForm: React.FC<UserFormProps> = ({ userId, onCancel, onSaved }) => {
  const isEditing = Boolean(userId);
  const { data: user, isLoading } = useUser(userId);
  const createUser = useCreateUser();
  const updateUser = useUpdateUser();

  const { role: actorRole } = usePermissions();
  const { user: sessionUser } = useAuth();

  const isSelfEdit =
    isEditing && String(userId) === String(sessionUser?.id);

  const allowedRoles = useMemo(
    () =>
      isSelfEdit && actorRole ? [actorRole] : manageableRoles(actorRole),
    [isSelfEdit, actorRole],
  );

  const schema = useMemo(
    () => makeUserSchema({ isEditing, allowedRoles }),
    [isEditing, allowedRoles],
  );

  const form = useForm<UserFormValues>({
    resolver: yupResolver(schema),
    defaultValues: emptyUserValues,
  });

  const { reset } = form;

  useEffect(() => {
    if (user) reset(userToFormValues(user));
  }, [user, reset]);

  const blocked = Boolean(
    user && !isSelfEdit && !canManageRole(actorRole, user.role),
  );

  useEffect(() => {
    if (blocked) onCancel();
  }, [blocked, onCancel]);

  if (blocked) return null;

  const handleSubmit = (values: UserFormValues) => {
    if (userId) {
      updateUser.mutate({ id: userId, payload: values });
    } else {
      createUser.mutate(values);
    }

    onSaved();
  };

  const tenant = accountTenant(sessionUser?.account);

  const roleOptions = allowedRoles.map((value) => ({
    value,
    label: ROLE_LABELS[value],
  }));

  const fields: RecordFormField<UserFormValues>[] = [
    ...(isEditing
      ? []
      : [
          {
            name: "account" as const,
            label: "Usuário (login)",
            icon: AtSign,
            placeholder: tenant ? `joao  →  joao@${tenant}` : "joao",
            required: true,
          },
        ]),
    {
      name: "name",
      label: "Nome completo",
      icon: UserIcon,
      placeholder: "Ex: João da Silva",
      required: true,
    },
    {
      name: "email",
      label: "E-mail",
      type: "email",
      icon: Mail,
      placeholder: "opcional",
      required: false,
    },
    {
      name: "role",
      label: isSelfEdit ? "Papel (não editável)" : "Papel",
      type: "select",
      icon: ShieldCheck,
      placeholder: "Selecione o papel",
      options: roleOptions,
      required: true,
      disabled: isSelfEdit,
    },
    {
      name: "password",
      label: isEditing ? "Nova senha" : "Senha",
      type: "password",
      icon: KeyRound,
      placeholder: isEditing
        ? "deixe em branco para manter a atual"
        : `mínimo de ${MIN_PASSWORD_LENGTH} caracteres`,
      required: !isEditing,
    },
  ];

  return (
    <RecordForm
      title={
        isSelfEdit
          ? "Editar minha conta"
          : isEditing
            ? "Editar usuário"
            : "Cadastrar usuário"
      }
      subtitle={
        isSelfEdit
          ? "Você pode alterar nome, e-mail e senha. O papel só muda por outra conta acima da sua."
          : isEditing && user
            ? `Login ${user.account} — o login não pode ser alterado.`
            : "O login recebe o sufixo do tenant automaticamente."
      }
      form={form}
      fields={fields}
      isLoading={isEditing && isLoading}
      submitLabel={isEditing ? "Salvar alterações" : "Salvar usuário"}
      submitIcon={<Save size={16} strokeWidth={1.8} />}
      onSubmit={handleSubmit}
      onCancel={onCancel}
    />
  );
};

export default UserForm;
