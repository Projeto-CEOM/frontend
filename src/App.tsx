import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { RoomsProvider } from "./contexts/RoomsContext";
import PrivateRouter from "./components/common/PrivateRouter";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Rooms from "./pages/Rooms";
import Sensors from "./pages/Sensors";
import AppShell from "./layouts/AppShell";

const App: React.FC = () => {
  return (
    <AuthProvider>
      <RoomsProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />

            <Route element={<PrivateRouter />}>
              <Route element={<AppShell />}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/salas" element={<Rooms />} />
                <Route path="/sensores" element={<Sensors />} />
              </Route>
            </Route>

            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </BrowserRouter>
      </RoomsProvider>
    </AuthProvider>
  );
};

App.displayName = "App";

export default App;
