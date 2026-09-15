import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { authApi } from "@/api/auth";
import { queryKeys } from "@/api/keys";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  selectIsAuthenticated,
  sessionUserUpdated,
} from "@/store/slices/authSlice";

export const useSessionSync = () => {
  const dispatch = useAppDispatch();
  const isAuthenticated = useAppSelector(selectIsAuthenticated);

  const query = useQuery({
    queryKey: queryKeys.auth.me(),
    queryFn: () => authApi.me(),
    enabled: isAuthenticated,
    staleTime: 0,
    gcTime: 0,
    retry: false,
  });

  const user = query.data;

  useEffect(() => {
    if (!user) return;

    dispatch(
      sessionUserUpdated({
        id: user.id,
        name: user.name,
        account: user.account,
        role: user.role,
      }),
    );
  }, [user, dispatch]);

  return query;
};
