import { Navigate, Outlet } from "react-router-dom";
import { usePermissions } from "@/hooks/UsePermissions";
import type { PermissionKey } from "@/utils/permissions";

type RequirePermissionProps = {
  permission: PermissionKey | PermissionKey[];
  mode?: "all" | "any";
  redirectTo?: string;
};

const RequirePermission: React.FC<RequirePermissionProps> = ({
  permission,
  mode = "all",
  redirectTo = "/dashboard",
}) => {
  const { can, canAny } = usePermissions();
  const keys = Array.isArray(permission) ? permission : [permission];
  const allowed = mode === "any" ? canAny(...keys) : can(...keys);

  if (!allowed) {
    return <Navigate to={redirectTo} replace />;
  }

  return <Outlet />;
};

export default RequirePermission;
