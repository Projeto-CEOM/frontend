import { Navigate, Outlet } from "react-router-dom";
import { useAppSelector } from "@/store/hooks";
import { selectIsAuthenticated } from "@/store/slices/authSlice";
import { useSessionSync } from "@/hooks/UseSessionSync";

const PrivateRouter: React.FC = () => {
  const isAuthenticated = useAppSelector(selectIsAuthenticated);

  useSessionSync();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};

export default PrivateRouter;
