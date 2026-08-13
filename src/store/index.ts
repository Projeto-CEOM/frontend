import { configureStore } from "@reduxjs/toolkit";
import { setAuthToken, setUnauthorizedHandler } from "@/api/client";
import { sessionEnded } from "./slices/authSlice";
import authReducer from "./slices/authSlice";
import layoutReducer from "./slices/layoutSlice";
import toastReducer from "./slices/toastSlice";
import { loadPersistedState, persistenceListener } from "./persistence";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    layout: layoutReducer,
    toast: toastReducer,
  },
  preloadedState: loadPersistedState(),
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().prepend(persistenceListener.middleware),
});

// Repassa o token reidratado para o interceptor do axios no boot da aplicação.
setAuthToken(store.getState().auth.token);

// 401 vindo da API encerra a sessão e devolve o usuário ao login.
setUnauthorizedHandler(() => {
  if (store.getState().auth.token) {
    store.dispatch(sessionEnded());
  }
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
