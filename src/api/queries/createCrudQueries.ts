import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
  type QueryKey,
} from "@tanstack/react-query";
import { nanoid } from "@reduxjs/toolkit";
import type { CrudApi, ListParams, Paginated } from "../types";

type EntityKeys = {
  all: QueryKey;
  /** Prefixo de todas as páginas — usado em filtros. */
  lists: () => QueryKey;
  /** Página concreta. */
  list: (params?: ListParams) => QueryKey;
  detail: (id: string) => QueryKey;
};

type CrudMessages = {
  created: string;
  updated: string;
  removed: string;
};

type CreateCrudQueriesOptions<TEntity, TPayload> = {
  api: CrudApi<TEntity, TPayload>;
  keys: EntityKeys;
  /** Mensagens de sucesso — os erros usam a mensagem do `ApiError`. */
  messages: CrudMessages;
  /** Outras chaves afetadas pela escrita (ex.: sensores dependem de salas). */
  relatedKeys?: QueryKey[];
  /**
   * Converte o payload na linha otimista. Sem isso o payload é copiado cru
   * para o cache, o que vaza campos que não pertencem à entidade — a senha do
   * formulário de usuários, por exemplo. Padrão: identidade.
   */
  toOptimistic?: (payload: TPayload) => Partial<TEntity>;
};

/** Snapshot de todas as páginas em cache, para rollback. */
type ListSnapshot<TEntity> = [QueryKey, Paginated<TEntity> | undefined][];

/**
 * Fábrica de hooks CRUD do react-query com atualização otimista.
 *
 * A listagem é paginada **pelo servidor**: `useList(params)` manda
 * `page`/`pageSize`/`sortBy`/`sortOrder` e recebe `{ data, meta }`. Cada
 * combinação de parâmetros é uma entrada de cache própria, então as escritas
 * otimistas percorrem todas as páginas em cache (`setQueriesData`) e o rollback
 * restaura o snapshot inteiro.
 *
 * O toast — sucesso pelo `meta` da mutation e erro pela mensagem do `ApiError` —
 * sai do `mutationCache` global em `src/api/queryClient.ts`.
 */
export const createCrudQueries = <
  TEntity extends { id: string },
  TPayload extends object,
>({
  api,
  keys,
  messages,
  relatedKeys = [],
  toOptimistic = (payload) => payload as unknown as Partial<TEntity>,
}: CreateCrudQueriesOptions<TEntity, TPayload>) => {
  const listFilter = () => ({ queryKey: keys.lists() });

  /** Aplica a mesma transformação em todas as páginas já carregadas. */
  const patchLists = (
    queryClient: QueryClient,
    patch: (page: Paginated<TEntity>) => Paginated<TEntity>,
  ) =>
    queryClient.setQueriesData<Paginated<TEntity>>(listFilter(), (page) =>
      page ? patch(page) : page,
    );

  const snapshotLists = (queryClient: QueryClient): ListSnapshot<TEntity> =>
    queryClient.getQueriesData<Paginated<TEntity>>(listFilter());

  const restoreLists = (
    queryClient: QueryClient,
    snapshot: ListSnapshot<TEntity> | undefined,
  ) => {
    snapshot?.forEach(([queryKey, page]) => {
      queryClient.setQueryData(queryKey, page);
    });
  };

  const useList = (params?: ListParams) =>
    useQuery({
      queryKey: keys.list(params),
      queryFn: () => api.list(params),
      // Trocar de página mantém as linhas anteriores enquanto a próxima chega:
      // sem skeleton, sem tabela vazia piscando.
      placeholderData: keepPreviousData,
    });

  const useDetail = (id: string | null) => {
    const queryClient = useQueryClient();

    /** Procura a entidade nas páginas já carregadas. */
    const findInLists = () => {
      if (!id) return undefined;

      for (const [queryKey, page] of snapshotLists(queryClient)) {
        const found = page?.data.find((item) => item.id === id);
        if (found) {
          return {
            found,
            updatedAt: queryClient.getQueryState(queryKey)?.dataUpdatedAt,
          };
        }
      }

      return undefined;
    };

    return useQuery({
      queryKey: keys.detail(id ?? ""),
      queryFn: () => api.get(id as string),
      enabled: Boolean(id),
      // Abre o formulário já preenchido com o item da lista; a idade do dado
      // vem da própria listagem, então a revalidação acontece na hora certa.
      initialData: () => findInLists()?.found,
      initialDataUpdatedAt: () => findInLists()?.updatedAt,
    });
  };

  const useInvalidateAll = () => {
    const queryClient = useQueryClient();

    return () =>
      Promise.all(
        [keys.all, ...relatedKeys].map((queryKey) =>
          queryClient.invalidateQueries({ queryKey }),
        ),
      );
  };

  const useCreate = () => {
    const queryClient = useQueryClient();
    const invalidateAll = useInvalidateAll();

    return useMutation({
      mutationFn: (payload: TPayload) => api.create(payload),
      meta: { successMessage: messages.created },
      onMutate: async (payload) => {
        await queryClient.cancelQueries(listFilter());

        const snapshot = snapshotLists(queryClient);
        const optimisticId = `temp-${nanoid()}`;
        const optimistic = {
          ...toOptimistic(payload),
          id: optimisticId,
        } as unknown as TEntity;

        // A ordenação é do servidor, então não dá para saber a posição real:
        // a linha entra no fim da página aberta e o `onSettled` acerta tudo.
        patchLists(queryClient, (page) => ({
          data: [...page.data, optimistic],
          meta: { ...page.meta, total: page.meta.total + 1 },
        }));

        return { snapshot };
      },
      onError: (_error, _payload, context) =>
        restoreLists(queryClient, context?.snapshot),
      onSettled: () => invalidateAll(),
    });
  };

  const useUpdate = () => {
    const queryClient = useQueryClient();
    const invalidateAll = useInvalidateAll();

    return useMutation({
      mutationFn: ({ id, payload }: { id: string; payload: TPayload }) =>
        api.update(id, payload),
      meta: { successMessage: messages.updated },
      onMutate: async ({ id, payload }) => {
        await queryClient.cancelQueries({ queryKey: keys.all });

        const snapshot = snapshotLists(queryClient);
        const previousDetail = queryClient.getQueryData<TEntity>(
          keys.detail(id),
        );
        const patch = toOptimistic(payload);

        patchLists(queryClient, (page) => ({
          ...page,
          data: page.data.map((item) =>
            item.id === id ? { ...item, ...patch } : item,
          ),
        }));

        if (previousDetail) {
          queryClient.setQueryData<TEntity>(keys.detail(id), {
            ...previousDetail,
            ...patch,
          });
        }

        return { snapshot, previousDetail };
      },
      onError: (_error, { id }, context) => {
        restoreLists(queryClient, context?.snapshot);

        if (context?.previousDetail) {
          queryClient.setQueryData(keys.detail(id), context.previousDetail);
        }
      },
      onSettled: () => invalidateAll(),
    });
  };

  const useDelete = () => {
    const queryClient = useQueryClient();
    const invalidateAll = useInvalidateAll();

    return useMutation({
      mutationFn: (id: string) => api.remove(id),
      meta: { successMessage: messages.removed },
      onMutate: async (id) => {
        await queryClient.cancelQueries(listFilter());

        const snapshot = snapshotLists(queryClient);

        patchLists(queryClient, (page) => {
          const data = page.data.filter((item) => item.id !== id);
          const removed = page.data.length - data.length;

          return {
            data,
            meta: {
              ...page.meta,
              total: Math.max(0, page.meta.total - removed),
            },
          };
        });

        return { snapshot };
      },
      onError: (_error, _id, context) =>
        restoreLists(queryClient, context?.snapshot),
      onSettled: () => invalidateAll(),
    });
  };

  return { useList, useDetail, useCreate, useUpdate, useDelete };
};
