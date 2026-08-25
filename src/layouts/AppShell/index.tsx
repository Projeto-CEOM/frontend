import { Outlet } from "react-router-dom";
import { Menu, Thermometer } from "lucide-react";
import Sidebar from "../Sidebar";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  mobileNavClosed,
  mobileNavToggled,
  selectMobileNavOpen,
} from "@/store/slices/layoutSlice";

const AppShell: React.FC = () => {
  const dispatch = useAppDispatch();
  const mobileNavOpen = useAppSelector(selectMobileNavOpen);

  return (
    // Altura fixa de viewport + `overflow-hidden`: a janela nunca rola, quem
    // rola é o `main`. Assim a sidebar não sai de vista e cada tela pode
    // definir a própria área de rolagem (ver Dashboard).
    <div className="flex h-screen w-full overflow-hidden bg-canvas">
      <Sidebar />

      {mobileNavOpen && (
        <div
          role="presentation"
          onClick={() => dispatch(mobileNavClosed())}
          className="fixed inset-0 z-40 bg-ink/40 backdrop-blur-[1px] md:hidden"
        />
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center gap-3 border-b border-border bg-surface px-4 py-3 md:hidden">
          <button
            type="button"
            onClick={() => dispatch(mobileNavToggled())}
            aria-label="Abrir menu"
            className="rounded-lg p-1.5 text-ink-soft transition-colors hover:bg-surface-hover"
          >
            <Menu size={20} strokeWidth={1.8} />
          </button>
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-white">
              <Thermometer size={15} strokeWidth={1.8} />
            </div>
            <p className="text-sm font-bold uppercase tracking-tight text-ink">
              PROJETO CEOM
            </p>
          </div>
        </header>

        {/* `min-h-0` é o que permite ao filho encolher abaixo do conteúdo —
            sem isso o flex estoura a altura e a rolagem interna não acontece. */}
        <main className="min-h-0 flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AppShell;
