import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom"; // Hook para navegar
import { 
  Users, Plus, Search, MapPin, Phone, 
  ChevronRight, LayoutList 
} from "lucide-react";
import { supabase } from "../../lib/supabase";
import { Client } from "../../types";

// Removemos as props antigas (onSelectClient, onNewClient)
export function ClientListPage() {
  const navigate = useNavigate();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('clients')
      .select('*')
      .order('created_at', { ascending: false });
    if (data) setClients(data);
    setLoading(false);
  };

  const filteredClients = clients.filter(c => 
    (c.nome && c.nome.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (c.cpf && c.cpf.includes(searchTerm))
  );

  const getStatusColor = (status: string | undefined) => {
      switch(status) {
          case 'Finalizado': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
          case 'Em Andamento': return 'bg-blue-100 text-blue-700 border-blue-200';
          default: return 'bg-slate-100 text-slate-500 border-slate-200';
      }
  };

  return (
    <div className="h-full flex flex-col bg-slate-50 font-sans">
      <header className="bg-white border-b border-slate-200 p-8">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
              <Users className="text-emerald-600"/> Carteira de Clientes
            </h1>
            <p className="text-slate-500 text-sm font-medium">Gerencie seus segurados rurais e processos</p>
          </div>
          
          <button 
            onClick={() => navigate('/cliente/novo')}
            className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all active:scale-95"
          >
            <Plus size={20}/> Novo Cliente
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-4 md:p-8">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="relative shadow-sm">
            <Search className="absolute left-4 top-3.5 text-slate-400" size={20}/>
            <input 
              type="text" 
              placeholder="Buscar por nome ou CPF..." 
              className="w-full pl-12 p-3.5 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all font-medium text-slate-700"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>

          {loading ? (
             <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-3">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
                <p className="text-sm font-medium">Carregando carteira...</p>
             </div>
          ) : filteredClients.length === 0 ? (
             <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-slate-200 flex flex-col items-center gap-4">
                <div className="bg-slate-50 p-4 rounded-full"><LayoutList size={40} className="text-slate-300"/></div>
                <div>
                    <p className="text-slate-800 font-bold text-lg">Nenhum cliente encontrado.</p>
                    <p className="text-slate-500 text-sm mb-4">Que tal cadastrar o primeiro agora?</p>
                    <button onClick={() => navigate('/cliente/novo')} className="text-emerald-600 font-bold hover:underline text-sm">Cadastrar Cliente</button>
                </div>
             </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-20">
              {filteredClients.map(client => (
                <div 
                  key={client.id} 
                  onClick={() => navigate(`/cliente/${client.id}`)} 
                  className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md cursor-pointer transition-all group hover:border-emerald-300 relative overflow-hidden"
                >
                  <div className="flex justify-between items-start mb-4">
                     <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center text-slate-600 font-bold text-xl border border-slate-100 group-hover:bg-emerald-50 group-hover:text-emerald-700 group-hover:border-emerald-100 transition-colors">
                      {client.nome ? client.nome.charAt(0).toUpperCase() : '?'}
                    </div>
                    <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wide border ${getStatusColor(client.status_processo as string)}`}>
                      {client.status_processo || 'A Iniciar'}
                   </span>
                  </div>
                  
                  <h3 className="font-bold text-slate-800 mb-1 truncate text-lg group-hover:text-emerald-700 transition-colors">{client.nome}</h3>
                  <p className="text-xs text-slate-400 font-mono mb-5 bg-slate-50 inline-block px-1.5 py-0.5 rounded border border-slate-100">{client.cpf}</p>
                  
                   <div className="space-y-2.5 text-sm text-slate-600 border-t border-slate-50 pt-4">
                    <div className="flex items-center gap-2.5">
                        <MapPin size={15} className="text-slate-400 shrink-0"/> 
                        <span className="truncate text-xs font-medium">{client.cidade || client.endereco || 'Local não informado'}</span>
                    </div>
                     <div className="flex items-center gap-2.5">
                        <Phone size={15} className="text-slate-400 shrink-0"/> 
                        <span className="truncate text-xs font-medium">{client.telefone || 'Sem telefone'}</span>
                    </div>
                  </div>

                  <div className="mt-4 flex justify-end text-slate-400 group-hover:text-emerald-600 font-bold text-xs items-center gap-1 transition-colors">
                    Abrir Ficha <ChevronRight size={14}/>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}