import { queryKeys } from "../keys";
import { usersApi } from "../users";
import type { User, UserPayload } from "../types";
import { createCrudQueries } from "./createCrudQueries";

const userQueries = createCrudQueries<User, UserPayload>({
  api: usersApi,
  keys: queryKeys.users,
  messages: {
    created: "Usuário cadastrado com sucesso.",
    updated: "Usuário atualizado com sucesso.",
    removed: "Usuário removido com sucesso.",
  },
  // A senha não pertence à entidade e não pode encostar no cache; `account`
  // sai do payload sem o `@tenant`, então na linha otimista fica de fora e
  // espera o `onSettled` trazer o valor real do servidor.
  toOptimistic: ({ name, email, role }) => ({
    name,
    email: email?.trim() ? email.trim() : null,
    role,
  }),
});

export const {
  useList: useUsers,
  useDetail: useUser,
  useCreate: useCreateUser,
  useUpdate: useUpdateUser,
  useDelete: useDeleteUser,
} = userQueries;
