/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** URL base da API (ex.: http://localhost:6767). */
  readonly VITE_API_URL?: string;

  /** Máscaras de permissão por papel (bitmap — ver `@/utils/permissions`). */
  readonly VITE_ROLE_ADMIN?: string;
  readonly VITE_ROLE_OWNER?: string;
  readonly VITE_ROLE_EDITOR?: string;
  readonly VITE_ROLE_VIEWER?: string;
  /** Papel assumido quando a sessão não traz um papel conhecido. */
  readonly VITE_DEFAULT_ROLE?: string;

  /** Porta do dev server do Vite. */
  readonly PORT?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
