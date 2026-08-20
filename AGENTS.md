# AGENTS.md

Guia de arquitetura do frontend do CEOM (monitoramento de acervo). Leia antes de
criar ou alterar telas — as regras abaixo não são sugestões, são o padrão do
projeto.

## Stack

React 19 + TypeScript + Vite 8 · Tailwind v4 · React Router v7
Redux Toolkit (estado de aplicação) · TanStack Query v5 (estado de servidor)
React Hook Form + Yup (formulários) · Axios (transporte)

## Comandos

```bash
yarn dev      # dev server (porta de PORT, padrão 3000)
yarn build    # typecheck do bundler + build de produção
yarn lint     # eslint
npx tsc --noEmit   # typecheck isolado
```

> Node: o `package.json` pede Node ≥ 20.19. Com versões abaixo disso, use
> `yarn add --ignore-engines` para instalar dependências.

## Estrutura

```
src/
  api/            todo acesso a dados (ver "Regra 1")
    client.ts         instância axios + interceptors + ApiError
    config.ts         VITE_API_URL
    keys.ts           chaves de cache do react-query
    queryClient.ts    QueryClient + toasts globais de mutation
    types.ts          tipos de domínio (Room, Sensor, AuthUser…)
    auth.ts rooms.ts sensors.ts    helpers por domínio
    queries/          hooks de react-query (createCrudQueries + useRooms…)
    utils/handleConfig.ts
  store/          redux: slices auth, layout, toast + persistência
  hooks/          hooks de composição (UseAuth, UsePermissions, UseToast…)
  components/common/  Input, Select, Button, DataTable, RecordForm, Toaster
  layouts/        AppShell, Sidebar
  pages/          uma pasta por tela: index.tsx (lista) + Form.tsx + schema.ts
  utils/          cn, format, permissions (bitmap), validation (yup pt-BR)
```

Convenções: imports por alias `@/…`; pasta em PascalCase com `index.tsx`;
textos de UI em pt-BR.

## Regra 1 — API só através dos helpers de `src/api`

Nenhum componente, página ou hook importa `axios` nem monta URL. Todo request
sai de um helper de domínio (`roomsApi`, `sensorsApi`, `authApi`), que usa o
`api` de `src/api/client.ts` — único ponto com axios, `Authorization` e
tratamento de erro.

Erros viram `ApiError` com mensagem já em pt-BR (`error.message` pode ir direto
para a tela). 401 encerra a sessão automaticamente.

### Rotas

Coleção com barra final, item sem. Note que salas é plural e sensor é singular —
é assim que o backend expõe:

| Operação  | Salas                    | Sensores                  |
| --------- | ------------------------ | ------------------------- |
| listar    | `GET /api/rooms/`        | `GET /api/sensor/`        |
| detalhe   | `GET /api/rooms/{id}`    | `GET /api/sensor/{id}`    |
| criar     | `POST /api/rooms/`       | `POST /api/sensor/`       |
| atualizar | `PUT /api/rooms/{id}`    | `PUT /api/sensor/{id}`    |
| remover   | `DELETE /api/rooms/{id}` | `DELETE /api/sensor/{id}` |

Login: `POST /api/auth/login` devolve `{ user, token }`.

Se o backend mudar o formato, ajuste só as constantes `COLLECTION`/`item` em
`src/api/<recurso>.ts`. **Não existe camada de mock** — toda tela fala com a API
real; a única configuração é `VITE_API_URL`.

> O Vite lê o `.env` só na inicialização: **reinicie o `yarn dev`** depois de
> mudar qualquer variável.

## Regra 2 — Estado: redux vs. react-query

| Tipo de estado                    | Onde mora                  |
| --------------------------------- | -------------------------- |
| Sessão/usuário/token/papel        | `store/slices/authSlice`   |
| Layout (sidebar, drawer mobile)   | `store/slices/layoutSlice` |
| Notificações                      | `store/slices/toastSlice`  |
| Qualquer dado vindo da API        | react-query (nunca redux)  |

Não use React Context para estado — os antigos `AuthContext`/`RoomsContext`
foram removidos. Consuma a store com `useAppSelector`/`useAppDispatch`
(`@/store/hooks`) e a sessão com `useAuth` (`@/hooks/UseAuth`).

Sessão e preferência de sidebar são persistidas em `localStorage` pelo listener
middleware de `store/persistence.ts` — não escreva no `localStorage` na mão.

## Regra 3 — Mutations são otimistas

Toda escrita assume sucesso: atualiza o cache no `onMutate`, reverte o estado
anterior no `onError` e revalida no `onSettled`. O toast de sucesso vem do
`meta.successMessage` e o de erro da mensagem do `ApiError` — ambos disparados
pelo `mutationCache` global em `src/api/queryClient.ts`, sem código por tela.
Use `meta.silentError` quando a tela já exibir o erro inline (ex.: login).

Na prática você não escreve isso à mão: `createCrudQueries` já entrega
`useList/useDetail/useCreate/useUpdate/useDelete` prontos.

```ts
// src/api/queries/useRooms.ts
const roomQueries = createCrudQueries<Room, RoomPayload>({
  api: roomsApi,
  keys: queryKeys.rooms,
  messages: { created: "…", updated: "…", removed: "…" },
  relatedKeys: [queryKeys.sensors.all], // invalidadas junto
});
```

Como a escrita é otimista, o formulário fecha imediatamente após o `mutate()` —
não espere a resposta para navegar.

Leituras (`useQuery`) mostram erro inline na tela; só mutations disparam toast.

### Listagens não piscam

`DataTable` recebe `isLoading` e mostra placeholders (skeleton) **apenas na
primeira carga**, quando ainda não há nada em cache — é exatamente o que o
`isLoading` do react-query v5 significa (`isPending && isFetching`).

Consequências que devem ser preservadas em qualquer tela nova:

- revalidação em segundo plano (após create/update/delete) mantém as linhas na
  tela: sem skeleton, sem "carregando", sem lista vazia piscando;
- a linha otimista já conta como dado, então o placeholder não volta;
- o erro da listagem só aparece quando não há nada para mostrar
  (`isError && data.length === 0`) — falha de revalidação não derruba a tela.

## Regra 4 — Formulários: React Hook Form + Yup em pt-BR

As mensagens padrão já estão traduzidas em `src/utils/validation/index.ts`
(`yup.setLocale`). **Não escreva mensagem de erro campo a campo**: declare a
regra e dê um `.label()` ao campo que a mensagem sai pronta. Mensagem manual só
para regra cruzada (ex.: "máxima deve ser maior que a mínima").

```ts
// pages/<Tela>/schema.ts
import { numberField, percentField, yup } from "@/utils/validation";

export const roomSchema = yup.object({
  name: yup.string().label("Nome da sala").trim().required().max(120),
  tempMin: numberField().label("Temperatura mínima").required().min(-50).max(80),
});
export type RoomFormValues = yup.InferType<typeof roomSchema>;
```

Importe sempre `yup` de `@/utils/validation` (garante o locale carregado).
`numberField()` converte `""` de `<input type="number">` em `undefined`, para
cair em "é obrigatório" em vez de "é inválido".

Na tela, `useForm` + `yupResolver` e o `RecordForm`, que recebe a instância do
form e a lista de campos (`name`, não `value`/`onChange`) e busca as mensagens
no `formState` sozinho:

```tsx
const form = useForm<RoomFormValues>({
  resolver: yupResolver(roomSchema),
  defaultValues: emptyRoomValues,
});

<RecordForm form={form} fields={fields} onSubmit={handleSubmit} … />
```

## Regra 5 — Permissões por papel (bitmap estilo `chmod`)

Cada permissão é um bit (`src/utils/permissions`):

| bit | valor | permissão |
| --- | ----- | --------- |
| 4   | 16    | `users`   |
| 3   | 8     | `create`  |
| 2   | 4     | `update`  |
| 1   | 2     | `delete`  |
| 0   | 1     | `read`    |

O papel vira a soma dos bits, sobrescrevível pelo `.env` (`VITE_ROLE_ADMIN`…,
tabela completa no `.env.example`):

| papel  | máscara | leitura |
| ------ | ------- | ------- |
| admin  | 31      | `Ucudr` |
| owner  | 31      | `Ucudr` |
| editor | 15      | `-cudr` |
| viewer | 1       | `----r` |

O papel chega na sessão (`AuthUser.role`) e a máscara é **derivada por selector**
no `authSlice` — não guarde a máscara na store, ela sai sempre do papel. Papel
desconhecido cai no `VITE_DEFAULT_ROLE` (padrão `viewer`); sem sessão a máscara
é `0`.

Nas telas, use o hook `usePermissions` (`@/hooks/UsePermissions`):

```tsx
const { can, canAny, role, label } = usePermissions();

{can("c") && <Button onClick={openForm}>Nova sala</Button>}
{can("u", "d") && <RowActions />}     // exige as duas
{canAny("u", "d") && <RowActions />}  // basta uma
```

Chaves aceitas: `users`, `c`, `r`, `u`, `d` (ou os nomes por extenso).
`usePermission("d")` é o atalho para um teste único.

> O papel vem do backend em `AuthUser.role` (resposta do login). Se a resposta
> não trouxer `role`, a sessão cai no `VITE_DEFAULT_ROLE` — `viewer`, ou seja,
> somente leitura.

## Receita: novo recurso CRUD

1. Tipos em `src/api/types.ts`.
2. Helper `src/api/<recurso>.ts` com as rotas do recurso.
3. Chaves em `src/api/keys.ts`.
4. Hooks em `src/api/queries/use<Recurso>.ts` via `createCrudQueries`.
5. `pages/<Recurso>/schema.ts` (yup), `Form.tsx` (RHF + `RecordForm`) e
   `index.tsx` (lista com `DataTable`).
6. Rota em `src/App.tsx` e item em `NAV_ITEMS` (`layouts/Sidebar`).

## Pendências conhecidas

- Telas de Canais e Relatórios existem no menu, mas ainda não têm rota/página.
- Dashboard é um placeholder ("TO DO").
- **Faixas de temperatura/umidade das salas**: em agosto/2026 o `GET /api/rooms/`
  devolvia só `id`, `name`, `description` e `createdAt`. O frontend envia
  `tempMin`, `tempMax`, `humidityMin` e `humidityMax` no POST/PUT, e por isso
  elas são opcionais em `Room` (`src/api/types.ts`) — a tabela mostra "—" quando
  não voltam. Se o backend já persiste, nada muda no frontend.
- O papel do usuário depende de o login devolver `role`; sem isso todo mundo
  entra como `viewer` (somente leitura).
- As permissões existem no store e no hook, mas ainda **não escondem botões nas
  telas** — o wiring de `can("c")`/`can("d")` em Salas e Sensores está pendente.
