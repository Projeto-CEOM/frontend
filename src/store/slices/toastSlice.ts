import { createSlice, nanoid, type PayloadAction } from "@reduxjs/toolkit";

export type ToastVariant = "success" | "error" | "info";

export type Toast = {
  id: string;
  message: string;
  variant: ToastVariant;
};

type ToastState = {
  items: Toast[];
};

const initialState: ToastState = {
  items: [],
};

const toastSlice = createSlice({
  name: "toast",
  initialState,
  reducers: {
    toastPushed: {
      reducer: (state, action: PayloadAction<Toast>) => {
        // Evita empilhar a mesma mensagem repetidas vezes.
        if (state.items.some((item) => item.message === action.payload.message))
          return;
        state.items.push(action.payload);
      },
      prepare: (message: string, variant: ToastVariant = "info") => ({
        payload: { id: nanoid(), message, variant },
      }),
    },
    toastDismissed: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter((item) => item.id !== action.payload);
    },
    toastsCleared: (state) => {
      state.items = [];
    },
  },
  selectors: {
    selectToasts: (state) => state.items,
  },
});

export const { toastPushed, toastDismissed, toastsCleared } =
  toastSlice.actions;
export const { selectToasts } = toastSlice.selectors;

export default toastSlice.reducer;
