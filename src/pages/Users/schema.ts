import type { DefaultValues } from "react-hook-form";
import { yup } from "@/utils/validation";
import type { User } from "@/api/users";
import type { Role } from "@/utils/permissions";

const ACCOUNT_PATTERN = /^[a-z0-9._-]{2,}$/;

export const MIN_PASSWORD_LENGTH = 6;

export const TELEGRAM_MAX_LENGTH = 100;

type UserSchemaOptions = {
  isEditing: boolean;
  allowedRoles: readonly Role[];
};

export const makeUserSchema = ({
  isEditing,
  allowedRoles,
}: UserSchemaOptions) =>
  yup.object({
    account: yup
      .string()
      .label("Usuário")
      .trim()
      .lowercase()
      .optional()
      .test("login-obrigatorio", "Usuário é obrigatório.", (value) =>
        isEditing ? true : Boolean(value?.trim()),
      )
      .test(
        "login-formato",
        "Formato de login inválido.",
        (value) =>
          isEditing || !value?.trim() || ACCOUNT_PATTERN.test(value.trim()),
      ),
    name: yup.string().label("Nome").trim().required().max(120),
    // email: yup.string().label("E-mail").trim().email().optional(),
    telegramUser: yup
      .string()
      .label("Telegram")
      .trim()
      .optional()
      .max(TELEGRAM_MAX_LENGTH),
    role: yup
      .mixed<Role>()
      .label("Papel")
      .required()
      .oneOf([...allowedRoles], "Você não pode atribuir esse papel."),
    password: yup
      .string()
      .label(isEditing ? "Nova senha" : "Senha")
      .trim()
      .optional()
      .test("senha-obrigatoria", "Senha é obrigatória.", (value) =>
        isEditing ? true : Boolean(value?.trim()),
      )
      .test(
        "senha-tamanho",
        `A senha deve ter no mínimo ${MIN_PASSWORD_LENGTH} caracteres.`,
        (value) => !value?.trim() || value.trim().length >= MIN_PASSWORD_LENGTH,
      ),
  });

export type UserFormValues = yup.InferType<ReturnType<typeof makeUserSchema>>;

export const emptyUserValues: DefaultValues<UserFormValues> = {
  account: "",
  name: "",
  // email: "",
  telegramUser: "",
  role: "viewer",
  password: "",
};

export const accountLocalPart = (account: string) =>
  account.includes("@") ? account.slice(0, account.lastIndexOf("@")) : account;

export const accountTenant = (account: string | undefined) =>
  account?.includes("@") ? account.slice(account.lastIndexOf("@") + 1) : null;

export const userToFormValues = (
  user: User,
): DefaultValues<UserFormValues> => ({
  account: accountLocalPart(user.account),
  name: user.name,
  // email: user.email ?? "",
  telegramUser: user.telegramUser ?? "",
  role: user.role,
  password: "",
});
