import { createListenerMiddleware, isAnyOf } from "@reduxjs/toolkit";
import { setAuthToken } from "@/api/client";
import {
  sessionEnded,
  sessionStarted,
  type AuthState,
} from "./slices/authSlice";
import {
  sidebarCollapsedChanged,
  sidebarToggled,
  type LayoutState,
} from "./slices/layoutSlice";
import type { RootState } from ".";

const AUTH_KEY = "ceom-monitor:auth";
const LAYOUT_KEY = "ceom-monitor:layout";

const read = <T>(key: string): T | undefined => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : undefined;
  } catch {
    return undefined;
  }
};

const write = (key: string, value: unknown) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage indisponível (modo privado, cota cheia) — segue sem persistir */
  }
};

/**
 * Estado inicial reidratado do localStorage, usado como `preloadedState` da
 * store para que sessão e preferências de layout sobrevivam ao refresh.
 */
export const loadPersistedState = (): {
  auth: AuthState;
  layout: LayoutState;
} => {
  const auth = read<AuthState>(AUTH_KEY);
  const layout = read<Pick<LayoutState, "sidebarCollapsed">>(LAYOUT_KEY);

  return {
    auth: auth?.user && auth.token ? auth : { user: null, token: null },
    layout: {
      sidebarCollapsed: Boolean(layout?.sidebarCollapsed),
      mobileNavOpen: false,
    },
  };
};

export const persistenceListener = createListenerMiddleware();

persistenceListener.startListening({
  matcher: isAnyOf(sessionStarted, sessionEnded),
  effect: (_action, api) => {
    const { auth } = api.getState() as RootState;

    setAuthToken(auth.token);

    if (auth.token && auth.user) {
      write(AUTH_KEY, {
        ...auth,
      });
    } else {
      localStorage.removeItem(AUTH_KEY);
    }
  },
});

persistenceListener.startListening({
  matcher: isAnyOf(sidebarToggled, sidebarCollapsedChanged),
  effect: (_action, api) => {
    const { layout } = api.getState() as RootState;
    write(LAYOUT_KEY, { sidebarCollapsed: layout.sidebarCollapsed });
  },
});
