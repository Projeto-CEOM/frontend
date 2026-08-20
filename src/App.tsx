import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import PrivateRouter from "@/components/common/PrivateRouter";
import RequirePermission from "@/components/common/RequirePermission";
import Toaster from "@/components/common/Toaster";
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import Rooms from "@/pages/Rooms";
import Sensors from "@/pages/Sensors";
import AppShell from "@/layouts/AppShell";

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route element={<PrivateRouter />}>
          <Route element={<AppShell />}>
            <Route element={<RequirePermission permission="r" />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/salas" element={<Rooms />} />
              <Route path="/sensores" element={<Sensors />} />
            </Route>
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>

      <Toaster />
    </BrowserRouter>
  );
};

App.displayName = "App";

export default App;
