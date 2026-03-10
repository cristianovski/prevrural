import { useEffect, useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Loader2 } from 'lucide-react';

export function ProtectedRoute() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    // 1. Busca a sessão atual
    const checkSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;
        
        if (mounted) {
          setSession(session);
          setLoading(false); // Liberta o ecrã se der sucesso
        }
      } catch (error) {
        console.error("Erro ao verificar sessão:", error);
        if (mounted) {
          setSession(null);
          setLoading(false); // CRUCIAL: Liberta o ecrã mesmo se a internet falhar ou der "Failed to fetch"
        }
      }
    };

    checkSession();

    // 2. Fica à escuta de mudanças (Login / Logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (mounted) {
        setSession(session);
        setLoading(false); // CRUCIAL: Liberta o ecrã após o login
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  if (loading) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-slate-50 text-slate-500 gap-4">
        <Loader2 className="animate-spin text-emerald-600" size={40} />
        <p className="font-medium animate-pulse">Verificando sessão...</p>
      </div>
    );
  }

  // Se não estiver a carregar e não houver sessão, manda para o Login
  if (!session) {
    return <Navigate to="/login" replace />;
  }

  // Se houver sessão, renderiza o sistema (Layout -> Dashboard)
  return <Outlet />;
}