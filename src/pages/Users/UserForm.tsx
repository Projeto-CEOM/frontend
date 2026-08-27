import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import {
  AtSign,
  KeyRound,
  Save,
  Send,
  ShieldCheck,
  User as UserIcon,
} from "lucide-react";
import { useCreateUser, useUpdateUser, useUser } from "@/api/queries/useUsers";
import type { User } from "@/api/users";
import RecordForm, {
  type RecordFormField,
} from "@/components/common/RecordForm";
import { usePermissions } from "@/hooks/UsePermissions";
import { useAuth } from "@/hooks/UseAuth";
import { useAppDispatch } from "@/store/hooks";
import { sessionUserUpdated } from "@/store/slices/authSlice";
import {
  ROLE_LABELS,
  canManageRole,
  manageableRoles,
} from "@/utils/permissions";
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
  title?: string;
  cancelLabel?: string;
  notice?: React.ReactNode;
  onResult?: (status: "success" | "error") => void;
};

const UserForm: React.FC<UserFormProps> = ({
  userId,
  onCancel,
  onSaved,
  title,
  cancelLabel,
  notice,
  onResult,
}) => {
  const isEditing = Boolean(userId);
  const { data: user, isLoading } = useUser(userId);
  const createUser = useCreateUser();
  const updateUser = useUpdateUser();

  const { role: actorRole } = usePermissions();
  const { user: sessionUser } = useAuth();
  const dispatch = useAppDispatch();

  const isSelfEdit = isEditing && String(userId) === String(sessionUser?.id);

  const allowedRoles = useMemo(
    () => (isSelfEdit && actorRole ? [actorRole] : manageableRoles(actorRole)),
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
    const settle = {
      onSuccess: (saved: User) => {
        if (isSelfEdit) {
          dispatch(
            sessionUserUpdated({
              name: saved.name,
              telegramUser: saved.telegramUser,
            }),
          );
        }

        onResult?.("success");
      },
      onError: () => onResult?.("error"),
    };

    if (userId) {
      updateUser.mutate({ id: userId, payload: values }, settle);
    } else {
      createUser.mutate(values, settle);
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
    // {
    //   name: "email",
    //   label: "E-mail",
    //   type: "email",
    //   icon: Mail,
    //   placeholder: "opcional",
    //   required: false,
    // },
    {
      name: "telegramUser",
      label: "Telegram",
      icon: Send,
      placeholder: "opcional — ex: @joao",
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
        title ??
        (isSelfEdit
          ? "Editar minha conta"
          : isEditing
            ? "Editar usuário"
            : "Cadastrar usuário")
      }
      subtitle={
        isSelfEdit
          ? `Login ${user?.account ?? ""} — você altera nome, e-mail e senha. O papel só muda por uma conta acima da sua.`
          : isEditing && user
            ? `Login ${user.account} — o login não pode ser alterado.`
            : "O login recebe o sufixo do tenant automaticamente."
      }
      cancelLabel={cancelLabel}
      notice={notice}
      form={form}
      fields={fields}
      isLoading={isEditing && isLoading}
      isSubmitting={updateUser.isPending || createUser.isPending}
      submitLabel={isEditing ? "Salvar alterações" : "Salvar usuário"}
      submitIcon={<Save size={16} strokeWidth={1.8} />}
      onSubmit={handleSubmit}
      onCancel={onCancel}
    />
  );
};

export default UserForm;
