import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

export function ProtectedRoute() {
  const { session, loading } = useAuth();

  if (loading) {
    return <div className="h-screen flex items-center justify-center bg-slate-900 text-emerald-500 font-bold">Verificando sessão...</div>;
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
