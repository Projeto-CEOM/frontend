import {
  useMutation,
  useQuery,
  useQueryClient,
  type QueryKey,
} from "@tanstack/react-query";
import { nanoid } from "@reduxjs/toolkit";
import type { CrudApi } from "../types";

type EntityKeys = {
  all: QueryKey;
  list: () => QueryKey;
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
};

/**
 * Fábrica de hooks CRUD do react-query com atualização otimista.
 *
 * Toda mutation assume sucesso: o cache é atualizado na hora (`onMutate`),
 * o estado anterior é restaurado se a API falhar (`onError`) e a lista é
 * revalidada ao final (`onSettled`). O toast — de sucesso pelo `meta` e de
 * erro pela mensagem do `ApiError` — sai do `mutationCache` global em
 * `src/api/queryClient.ts`.
 */
export const createCrudQueries = <
  TEntity extends { id: string },
  TPayload extends object,
>({
  api,
  keys,
  messages,
  relatedKeys = [],
}: CreateCrudQueriesOptions<TEntity, TPayload>) => {
  const useList = () =>
    useQuery({
      queryKey: keys.list(),
      queryFn: api.list,
    });

  const useDetail = (id: string | null) => {
    const queryClient = useQueryClient();

    return useQuery({
      queryKey: keys.detail(id ?? ""),
      queryFn: () => api.get(id as string),
      enabled: Boolean(id),
      // Aproveita o item já presente na lista para abrir o formulário
      // preenchido; a idade do dado vem da própria lista.
      initialData: () =>
        queryClient
          .getQueryData<TEntity[]>(keys.list())
          ?.find((item) => item.id === id),
      initialDataUpdatedAt: () =>
        queryClient.getQueryState(keys.list())?.dataUpdatedAt,
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
        await queryClient.cancelQueries({ queryKey: keys.all });

        const previousList = queryClient.getQueryData<TEntity[]>(keys.list());
        const optimisticId = `temp-${nanoid()}`;

        queryClient.setQueryData<TEntity[]>(keys.list(), (current) => [
          ...(current ?? []),
          { ...payload, id: optimisticId } as unknown as TEntity,
        ]);

        return { previousList, optimisticId };
      },
      onError: (_error, _payload, context) => {
        if (!context) return;

        queryClient.setQueryData<TEntity[]>(
          keys.list(),
          context.previousList ??
            ((current) =>
              (current ?? []).filter(
                (item) => item.id !== context.optimisticId,
              )),
        );
      },
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

        const previousList = queryClient.getQueryData<TEntity[]>(keys.list());
        const previousDetail = queryClient.getQueryData<TEntity>(
          keys.detail(id),
        );

        queryClient.setQueryData<TEntity[]>(keys.list(), (current) =>
          (current ?? []).map((item) =>
            item.id === id ? { ...item, ...payload } : item,
          ),
        );

        if (previousDetail) {
          queryClient.setQueryData<TEntity>(keys.detail(id), {
            ...previousDetail,
            ...payload,
          });
        }

        return { previousList, previousDetail };
      },
      onError: (_error, { id }, context) => {
        if (!context) return;

        if (context.previousList) {
          queryClient.setQueryData(keys.list(), context.previousList);
        }
        if (context.previousDetail) {
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
        await queryClient.cancelQueries({ queryKey: keys.all });

        const previousList = queryClient.getQueryData<TEntity[]>(keys.list());

        queryClient.setQueryData<TEntity[]>(keys.list(), (current) =>
          (current ?? []).filter((item) => item.id !== id),
        );

        return { previousList };
      },
      onError: (_error, _id, context) => {
        if (context?.previousList) {
          queryClient.setQueryData(keys.list(), context.previousList);
        }
      },
      onSettled: () => invalidateAll(),
    });
  };

  return { useList, useDetail, useCreate, useUpdate, useDelete };
};
