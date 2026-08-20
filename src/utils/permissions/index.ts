/**
 * Permissões no estilo `chmod`: cada permissão é um bit e o papel do usuário
 * vira uma máscara (soma dos bits). Verificar acesso é um AND bit a bit.
 *
 *   bit | valor | permissão
 *   ----+-------+-----------
 *    4  |   16  | users
 *    3  |    8  | create
 *    2  |    4  | update
 *    1  |    2  | delete
 *    0  |    1  | read
 */
export const PERMISSIONS = {
  users: 1 << 4,
  create: 1 << 3,
  update: 1 << 2,
  delete: 1 << 1,
  read: 1 << 0,
} as const;

export type PermissionName = keyof typeof PERMISSIONS;

/** Atalhos aceitos nas verificações: "c", "r", "u", "d". */
const ALIASES = {
  c: "create",
  r: "read",
  u: "update",
  d: "delete",
} as const;

export type PermissionKey = PermissionName | keyof typeof ALIASES;

export const ALL_PERMISSIONS = Object.values(PERMISSIONS).reduce(
  (mask, bit) => mask | bit,
  0,
);

export const ROLES = ["admin", "owner", "editor", "viewer"] as const;

export type Role = (typeof ROLES)[number];

/** Máscaras padrão, usadas quando o `.env` não define a do papel. */
const FALLBACK_MASKS: Record<Role, number> = {
  admin: 31, // users + create + update + delete + read
  owner: 31, // users + create + update + delete + read
  editor: 15, //        create + update + delete + read
  viewer: 1, //                                    read
};

const parseMask = (raw: string | undefined, fallback: number) => {
  if (raw === undefined || raw.trim() === "") return fallback;

  const parsed = Number(raw);
  return Number.isInteger(parsed) && parsed >= 0
    ? parsed & ALL_PERMISSIONS
    : fallback;
};

/** Máscara de cada papel — sobrescrevível pelo `.env`. */
export const ROLE_MASKS: Record<Role, number> = {
  admin: parseMask(import.meta.env.VITE_ROLE_ADMIN, FALLBACK_MASKS.admin),
  owner: parseMask(import.meta.env.VITE_ROLE_OWNER, FALLBACK_MASKS.owner),
  editor: parseMask(import.meta.env.VITE_ROLE_EDITOR, FALLBACK_MASKS.editor),
  viewer: parseMask(import.meta.env.VITE_ROLE_VIEWER, FALLBACK_MASKS.viewer),
};

const isRole = (value: unknown): value is Role =>
  typeof value === "string" && (ROLES as readonly string[]).includes(value);

const envDefaultRole = import.meta.env.VITE_DEFAULT_ROLE;

/** Papel assumido quando a sessão não traz um papel conhecido. */
export const DEFAULT_ROLE: Role = isRole(envDefaultRole)
  ? envDefaultRole
  : "viewer";

export const normalizeRole = (value: unknown): Role =>
  isRole(value) ? value : DEFAULT_ROLE;

export const maskForRole = (value: unknown): number =>
  ROLE_MASKS[normalizeRole(value)];

const bitOf = (key: PermissionKey): number => {
  const name =
    (ALIASES as Record<string, PermissionName>)[key] ?? (key as PermissionName);
  return PERMISSIONS[name] ?? 0;
};

/** true quando a máscara contém TODAS as permissões pedidas. */
export const can = (mask: number, ...keys: PermissionKey[]) =>
  keys.length > 0 && keys.every((key) => (mask & bitOf(key)) !== 0);

/** true quando a máscara contém ao menos UMA das permissões pedidas. */
export const canAny = (mask: number, ...keys: PermissionKey[]) =>
  keys.some((key) => (mask & bitOf(key)) !== 0);

/** Leitura estilo `ls -l`: "Ucudr", com "-" no lugar do que falta. */
export const formatMask = (mask: number) =>
  (
    [
      ["users", "U"],
      ["create", "c"],
      ["update", "u"],
      ["delete", "d"],
      ["read", "r"],
    ] as const
  )
    .map(([name, letter]) => ((mask & PERMISSIONS[name]) !== 0 ? letter : "-"))
    .join("");
