import { useMemo } from "react";
import { useAppSelector } from "@/store/hooks";
import {
  selectPermissionMask,
  selectRole,
} from "@/store/slices/authSlice";
import {
  can,
  canAny,
  formatMask,
  type PermissionKey,
} from "@/utils/permissions";

/**
 * Permissões do usuário logado.
 *
 * ```tsx
 * const { can } = usePermissions();
 * can("c");            // pode criar?
 * can("users");        // pode gerir usuários?
 * can("u", "d");       // pode atualizar E remover?
 * ```
 */
export const usePermissions = () => {
  const role = useAppSelector(selectRole);
  const mask = useAppSelector(selectPermissionMask);

  return useMemo(
    () => ({
      role,
      mask,
      /** Exige TODAS as permissões informadas. */
      can: (...keys: PermissionKey[]) => can(mask, ...keys),
      /** Basta UMA das permissões informadas. */
      canAny: (...keys: PermissionKey[]) => canAny(mask, ...keys),
      /** Máscara legível, estilo `ls -l`: "Ucudr". */
      label: formatMask(mask),
    }),
    [role, mask],
  );
};

/** Versão direta para um teste único: `usePermission("d")`. */
export const usePermission = (...keys: PermissionKey[]) => {
  const mask = useAppSelector(selectPermissionMask);
  return can(mask, ...keys);
};
