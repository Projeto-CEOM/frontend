import { Outlet } from "react-router-dom";
import Sidebar from "../Sidebar";

const AppShell: React.FC = () => {
  return (
    <div className="flex min-h-screen w-full bg-canvas">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
};

export default AppShell;
