import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  DoorOpen,
  LogOut,
  ChevronDown,
  Thermometer,
  type LucideIcon,
  CircuitBoard,
  Send,
  FileText,
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";

const NAV_ITEMS: { to: string; label: string; icon: LucideIcon }[] = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/salas", label: "Salas", icon: DoorOpen },
  { to: "/sensores", label: "Sensores", icon: CircuitBoard },
  { to: "/canais", label: "Canais", icon: Send },
  { to: "/relatorios", label: "Relatórios", icon: FileText },
];

const Sidebar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const initial = (user ?? "").trim().charAt(0).toUpperCase() || "?";

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <aside className="flex h-screen w-64 shrink-0 flex-col border-r border-border bg-surface">
      <div className="flex items-center gap-2.5 px-5 py-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-white">
          <Thermometer size={18} strokeWidth={1.8} />
        </div>
        <div className="leading-tight">
          <p className="text-sm font-bold uppercase tracking-tight text-ink">
            PROJETO CEOM
          </p>
          <p className="text-[10px] font-medium uppercase tracking-widest text-ink-muted">
            Monitoramento
          </p>
        </div>
      </div>

      <button className="mx-3 mb-12 flex items-center gap-2.5 rounded-xl border border-border px-3 py-2.5 hover:bg-primary-hover/10">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
          {initial}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-medium text-ink">
            {user}
          </span>
          <span className="block truncate text-xs text-ink-faint">Conta</span>
        </span>
        <ChevronDown
          size={16}
          strokeWidth={1.8}
          className="shrink-0 text-ink-faint"
        />
      </button>

      <nav className="flex flex-1 flex-col gap-3 px-3 pt-2">
        {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-ink-soft hover:bg-surface-hover"
              }`
            }
          >
            <Icon size={17} strokeWidth={1.8} />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-border p-3">
        <button
          type="button"
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-ink-soft transition-colors hover:bg-danger-soft hover:text-danger"
        >
          <LogOut size={17} strokeWidth={1.8} />
          Sair
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
