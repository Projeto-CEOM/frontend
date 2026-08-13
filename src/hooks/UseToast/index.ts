import { useMemo } from "react";
import { useAppDispatch } from "@/store/hooks";
import { toastPushed } from "@/store/slices/toastSlice";

/** Atalho para disparar notificações a partir de componentes. */
export const useToast = () => {
  const dispatch = useAppDispatch();

  return useMemo(
    () => ({
      success: (message: string) => dispatch(toastPushed(message, "success")),
      error: (message: string) => dispatch(toastPushed(message, "error")),
      info: (message: string) => dispatch(toastPushed(message, "info")),
    }),
    [dispatch],
  );
};
