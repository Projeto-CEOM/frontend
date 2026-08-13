/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** URL base da API (ex.: http://localhost:6767). */
  readonly VITE_API_URL?: string;
  /** `false` aponta os helpers de `src/api` para a API real. */
  readonly VITE_USE_MOCK_API?: string;
  /** Porta do dev server do Vite. */
  readonly PORT?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
