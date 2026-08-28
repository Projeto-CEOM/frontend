import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  DoorOpen,
  LogOut,
  ChevronDown,
  Thermometer,
  type LucideIcon,
  CircuitBoard,
  TriangleAlert,
  Send,
  FileText,
  PanelLeftClose,
  PanelLeftOpen,
  UsersRound,
  Settings,
  List,
} from "lucide-react";
import { cn } from "@/utils/cn";
import { useAuth } from "@/hooks/UseAuth";
import { usePermissions } from "@/hooks/UsePermissions";
import type { PermissionKey } from "@/utils/permissions";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  mobileNavClosed,
  selectMobileNavOpen,
  selectSidebarCollapsed,
  sidebarToggled,
} from "@/store/slices/layoutSlice";

/** `permission` ausente = item visível para qualquer sessão autenticada. */
const NAV_ITEMS: {
  to: string;
  label: string;
  icon: LucideIcon;
  permission?: PermissionKey;
}[] = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/alertas", label: "Alertas", icon: TriangleAlert },
  { to: "/leituras", label: "Leituras", icon: List },
  { to: "/sensores", label: "Sensores", icon: CircuitBoard },
  { to: "/salas", label: "Salas", icon: DoorOpen },
  { to: "/canais", label: "Canais", icon: Send },
  { to: "/relatorios", label: "Relatórios", icon: FileText },
  { to: "/usuarios", label: "Usuários", icon: UsersRound, permission: "users" },
];

const Sidebar: React.FC = () => {
  const { user, logout } = useAuth();
  const dispatch = useAppDispatch();
  const collapsed = useAppSelector(selectSidebarCollapsed);
  const mobileNavOpen = useAppSelector(selectMobileNavOpen);
  const navigate = useNavigate();
  const { can } = usePermissions();

  const navItems = NAV_ITEMS.filter(
    ({ permission }) => !permission || can(permission),
  );

  const initial = (user?.name ?? "").trim().charAt(0).toUpperCase() || "?";

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-50 flex h-screen shrink-0 flex-col border-r border-border bg-surface transition-[width,transform] duration-200 md:static md:translate-x-0",
        collapsed ? "w-19" : "w-64",
        mobileNavOpen ? "translate-x-0" : "-translate-x-full",
      )}
    >
      <div
        className={cn(
          "flex items-center gap-2.5 px-5 py-5",
          collapsed && "justify-center px-0",
        )}
      >
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary text-white">
          <Thermometer size={18} strokeWidth={1.8} />
        </div>
        {!collapsed && (
          <div className="leading-tight">
            <p className="text-sm font-bold uppercase tracking-tight text-ink">
              PROJETO CEOM
            </p>
            <p className="text-[10px] font-medium uppercase tracking-widest text-ink-muted">
              Monitoramento
            </p>
          </div>
        )}
      </div>

      <button
        type="button"
        title={user?.account}
        className={cn(
          "mx-3 mb-12 flex items-center gap-2.5 rounded-xl border border-border px-3 py-2.5 ",
          collapsed && "justify-center px-0",
        )}
      >
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
          {initial}
        </span>
        {!collapsed && (
          <>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-left text-sm font-medium text-ink">
                {user?.name}
              </span>
              <span className="block truncate text-left text-xs text-ink-faint">
                {user?.account ?? "Conta"}
              </span>
            </span>
          </>
        )}
      </button>

      <nav className="flex flex-1 flex-col gap-3 px-3 pt-2">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            title={collapsed ? label : undefined}
            onClick={() => dispatch(mobileNavClosed())}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                collapsed && "justify-center px-0",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-ink-soft hover:bg-surface-hover",
              )
            }
          >
            <Icon size={17} strokeWidth={1.8} className="shrink-0" />
            {!collapsed && label}
          </NavLink>
        ))}
      </nav>

      <div className="flex flex-col gap-1 border-t border-border p-3">
        <NavLink
          to="/configuracoes"
          title={collapsed ? "Configurações" : undefined}
          onClick={() => dispatch(mobileNavClosed())}
          className={({ isActive }) =>
            cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
              collapsed && "justify-center px-0",
              isActive
                ? "bg-primary/10 text-primary"
                : "text-ink-soft hover:bg-surface-hover",
            )
          }
        >
          <Settings size={17} strokeWidth={1.8} className="shrink-0" />
          {!collapsed && "Configurações"}
        </NavLink>

        <button
          type="button"
          onClick={() => dispatch(sidebarToggled())}
          title={collapsed ? "Expandir menu" : "Recolher menu"}
          className={cn(
            "hidden items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-ink-soft transition-colors hover:bg-surface-hover md:flex overflow-hidden whitespace-nowrap text-ellipsis",
            collapsed && "justify-center px-0",
          )}
        >
          {collapsed ? (
            <PanelLeftOpen size={17} strokeWidth={1.8} className="shrink-0" />
          ) : (
            <PanelLeftClose size={17} strokeWidth={1.8} className="shrink-0" />
          )}
          {!collapsed && "Recolher menu"}
        </button>

        <button
          type="button"
          onClick={handleLogout}
          title={collapsed ? "Sair" : undefined}
          className={cn(
            "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-ink-soft transition-colors hover:bg-danger-soft hover:text-danger",
            collapsed && "justify-center px-0",
          )}
        >
          <LogOut size={17} strokeWidth={1.8} className="shrink-0" />
          {!collapsed && "Sair"}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
