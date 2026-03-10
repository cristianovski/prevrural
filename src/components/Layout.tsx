// src/components/Layout.tsx
import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { 
  LayoutDashboard, Users, BookCopy, Briefcase, LogOut, DollarSign 
} from "lucide-react";
import { supabase } from "../lib/supabase";

export function Layout() {
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate(0);
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans text-slate-800 selection:bg-emerald-100 selection:text-emerald-900">
      
      {/* SIDEBAR FIXA */}
      <aside className="w-72 bg-white flex flex-col border-r border-slate-200 hidden md:flex shadow-xl z-20">
        <div className="p-8 border-b border-slate-100 flex items-center gap-4">
          <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center text-white font-bold shadow-lg shadow-emerald-200">
            <LayoutDashboard size={20}/>
          </div>
          <div>
            <h2 className="font-bold text-slate-800 text-lg leading-none">PrevRural</h2>
            <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest mt-1">Advocacia</p>
          </div>
        </div>
        
        <nav className="flex-1 p-6 space-y-2 overflow-y-auto">
            <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-2 px-2">Principal</div>
            
            <Link to="/" className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${isActive('/') ? 'bg-emerald-50 text-emerald-700 shadow-sm ring-1 ring-emerald-100' : 'text-slate-600 hover:bg-slate-50'}`}>
                <Users size={18}/> Carteira de Clientes
            </Link>

            <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mt-6 mb-2 px-2">Gestão</div>
            
            <Link to="/biblioteca" className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${isActive('/biblioteca') ? 'bg-emerald-50 text-emerald-700' : 'text-slate-500 hover:bg-emerald-50 hover:text-emerald-700'}`}>
                <BookCopy size={18}/> Biblioteca de Teses
            </Link>
            
            <Link to="/advogados" className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${isActive('/advogados') ? 'bg-emerald-50 text-emerald-700' : 'text-slate-500 hover:bg-emerald-50 hover:text-emerald-700'}`}>
                <Briefcase size={18}/> Equipe & Advogados
            </Link>

            {/* NOVO ITEM: FLUXO DE CAIXA */}
            <Link to="/fluxo-caixa" className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${isActive('/fluxo-caixa') ? 'bg-emerald-50 text-emerald-700' : 'text-slate-500 hover:bg-emerald-50 hover:text-emerald-700'}`}>
                <DollarSign size={18}/> Fluxo de Caixa
            </Link>
        </nav>
        
        <div className="p-6 border-t border-slate-100">
            <button onClick={handleLogout} className="w-full text-slate-500 hover:text-red-600 flex items-center gap-3 px-4 py-3 text-sm font-medium hover:bg-red-50 rounded-xl transition-colors">
                <LogOut size={18}/> Encerrar Sessão
            </button>
        </div>
      </aside>

      {/* ÁREA DE CONTEÚDO DINÂMICO */}
      <main className="flex-1 flex flex-col overflow-hidden relative bg-slate-50">
        <Outlet />
      </main>
    </div>
  );
}