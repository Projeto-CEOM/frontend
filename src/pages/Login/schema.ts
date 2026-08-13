import { yup } from "@/utils/validation";

export const loginSchema = yup.object({
  email: yup.string().label("Usuário").trim().required().email(),
  password: yup.string().label("Senha").required(),
  rememberMe: yup.boolean().label("Lembrar de mim").default(false),
});

export type LoginFormValues = yup.InferType<typeof loginSchema>;
