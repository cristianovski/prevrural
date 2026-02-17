import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Plus, Search, Filter, DollarSign, StickyNote, 
  Trash2, UserCog, MessageCircle, Calculator, 
  BrainCircuit, TrendingUp, FolderOpen, Printer, 
  BookCheck, Cake, Users
} from "lucide-react";
import { supabase } from "../lib/supabase";
import { useToast } from "../hooks/use-toast";

interface Client {
  id: number;
  nome: string;
  cpf: string;
  telefone?: string;
  honorarios?: number;
  status_processo?: string;
  data_nascimento?: string; 
  created_at: string;
}

export function DashboardPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("Todos");
  const [notes, setNotes] = useState<string[]>([]);
  const [newNote, setNewNote] = useState("");

  useEffect(() => {
    fetchClients();
    const savedNotes = localStorage.getItem("dashboardNotes");
    if (savedNotes) setNotes(JSON.parse(savedNotes));
  }, []);

  const fetchClients = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('clients').select('*').order('created_at', { ascending: false });
    if (error) {
        toast({ title: "Erro", description: "Falha ao carregar clientes", variant: "destructive" });
    }
    if (data) setClients(data);
    setLoading(false);
  };

  const handleDeleteClient = async (id: number) => {
    if (confirm("ATENÇÃO: Apagar este cliente removerá tudo (ficha, documentos, histórico). Continuar?")) {
      const { error } = await supabase.from('clients').delete().eq('id', id);
      if (error) {
          toast({ title: "Erro", description: "Não foi possível excluir.", variant: "destructive" });
      } else {
          toast({ title: "Sucesso", description: "Cliente removido.", variant: "success" });
          fetchClients();
      }
    }
  };

  const toggleStatus = async (client: Client) => {
      const ciclo = ["A Iniciar", "Em Andamento", "Finalizado"];
      const atual = client.status_processo || "A Iniciar";
      const novo = ciclo[(ciclo.indexOf(atual) + 1) % ciclo.length];
      
      // Atualização Otimista
      setClients(prev => prev.map(c => c.id === client.id ? { ...c, status_processo: novo } : c));
      
      await supabase.from('clients').update({ status_processo: novo }).eq('id', client.id);
      toast({ title: "Status Atualizado", description: `Novo status: ${novo}`, variant: "default" });
  };

  const addNote = () => {
      if (!newNote.trim()) return;
      const updated = [...notes, newNote];
      setNotes(updated);
      setNewNote("");
      localStorage.setItem("dashboardNotes", JSON.stringify(updated));
  };

  const removeNote = (idx: number) => {
      const updated = notes.filter((_, i) => i !== idx);
      setNotes(updated);
      localStorage.setItem("dashboardNotes", JSON.stringify(updated));
  };

  const getStatusColor = (status?: string) => {
      switch(status) {
          case 'Finalizado': return 'bg-emerald-500';
          case 'Em Andamento': return 'bg-blue-500';
          default: return 'bg-amber-400';
      }
  };

  const clientesFiltrados = clients.filter(c => {
      const s = searchTerm.toLowerCase();
      return (c.nome.toLowerCase().includes(s) || c.cpf.includes(s)) && (statusFilter === "Todos" || (c.status_processo || "A Iniciar") === statusFilter);
  });

  const totalCarteira = clients.reduce((acc, curr) => acc + Number(curr.honorarios || 0), 0);
  
  const stats = {
      iniciar: clients.filter(c => !c.status_processo || c.status_processo === 'A Iniciar').length,
      andamento: clients.filter(c => c.status_processo === 'Em Andamento').length,
      finalizado: clients.filter(c => c.status_processo === 'Finalizado').length,
      total: clients.length || 1
  };

  const mesAtual = new Date().getMonth();
  const aniversariantes = clients.filter(c => {
      if (!c.data_nascimento) return false;
      const mesNasc = parseInt(c.data_nascimento.split('-')[1]) - 1;
      return mesNasc === mesAtual;
  }).sort((a, b) => parseInt(a.data_nascimento!.split('-')[2]) - parseInt(b.data_nascimento!.split('-')[2]));

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-8 scroll-smooth">
        <div className="max-w-7xl mx-auto pb-20 flex flex-col lg:flex-row gap-8">
            {/* COLUNA PRINCIPAL */}
            <div className="flex-1 space-y-8 min-w-0">
                
                {/* HERO STATS */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-gradient-to-br from-emerald-600 to-teal-800 p-6 rounded-[2rem] shadow-xl shadow-emerald-200 text-white flex flex-col justify-between h-40 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -mr-10 -mt-10 group-hover:bg-white/20 transition-all"></div>
                        <div className="relative z-10 flex justify-between items-start">
                            <div><p className="text-xs font-bold text-emerald-100 uppercase tracking-wider mb-2">Potencial da Carteira</p><h3 className="text-3xl font-black tracking-tight">{totalCarteira.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })}</h3></div>
                            <div className="bg-white/20 p-2 rounded-xl backdrop-blur-md"><DollarSign size={24} className="text-white"/></div>
                        </div>
                        <div className="relative z-10 text-xs font-medium text-emerald-100 mt-auto flex items-center gap-1"><div className="w-1.5 h-1.5 bg-emerald-300 rounded-full animate-pulse"></div> Atualizado hoje</div>
                    </div>
                    
                    <div className="md:col-span-2 bg-white p-6 rounded-[2rem] shadow-sm border border-slate-200 flex flex-col justify-center h-40">
                        <h3 className="font-bold text-slate-700 mb-6 flex items-center gap-2 text-sm uppercase tracking-wide"><Filter size={16} className="text-slate-400"/> Funil de Processos</h3>
                        <div className="space-y-5">
                            <div className="flex items-center gap-4 text-xs font-medium">
                                <span className="w-24 text-slate-500 font-bold">A Iniciar</span>
                                <div className="flex-1 h-2.5 bg-slate-100 rounded-full overflow-hidden"><div className="h-full bg-amber-400 rounded-full transition-all duration-1000" style={{width: `${(stats.iniciar/stats.total)*100}%`}}></div></div>
                                <span className="w-8 text-right font-bold text-slate-800">{stats.iniciar}</span>
                            </div>
                            <div className="flex items-center gap-4 text-xs font-medium">
                                <span className="w-24 text-slate-500 font-bold">Em Andamento</span>
                                <div className="flex-1 h-2.5 bg-slate-100 rounded-full overflow-hidden"><div className="h-full bg-blue-500 rounded-full transition-all duration-1000" style={{width: `${(stats.andamento/stats.total)*100}%`}}></div></div>
                                <span className="w-8 text-right font-bold text-slate-800">{stats.andamento}</span>
                            </div>
                            <div className="flex items-center gap-4 text-xs font-medium">
                                <span className="w-24 text-slate-500 font-bold">Finalizados</span>
                                <div className="flex-1 h-2.5 bg-slate-100 rounded-full overflow-hidden"><div className="h-full bg-emerald-500 rounded-full transition-all duration-1000" style={{width: `${(stats.finalizado/stats.total)*100}%`}}></div></div>
                                <span className="w-8 text-right font-bold text-slate-800">{stats.finalizado}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* BARRA DE PESQUISA E FILTROS */}
                <div className="flex flex-col gap-4">
                    <div className="flex flex-col md:flex-row gap-4 items-center">
                        <div className="relative flex-1 w-full group">
                            <Search className="absolute left-5 top-4 text-slate-400 group-focus-within:text-emerald-600 transition-colors" size={20}/>
                            <input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Buscar cliente por nome ou CPF..." className="w-full pl-14 pr-6 py-4 rounded-2xl bg-white border border-slate-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all font-medium text-slate-700 shadow-sm group-focus-within:shadow-md"/>
                        </div>
                        <button onClick={() => navigate('/cliente/novo')} className="w-full md:w-auto bg-slate-900 hover:bg-black text-white px-8 py-4 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-xl shadow-slate-900/20 hover:scale-[1.02] transition-all active:scale-95 whitespace-nowrap"><Plus size={20}/> Novo Cliente</button>
                    </div>
                    
                    <div className="flex gap-2 overflow-x-auto pb-2">
                        {["Todos", "A Iniciar", "Em Andamento", "Finalizado"].map(st => (
                            <button key={st} onClick={() => setStatusFilter(st)} className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-colors border ${statusFilter === st ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'}`}>
                                {st}
                            </button>
                        ))}
                    </div>
                </div>

                {/* LISTA DE CLIENTES */}
                <div className="space-y-4">
                    {loading ? <div className="text-center py-20 text-slate-400">Carregando carteira...</div> : clientesFiltrados.length === 0 ? <div className="text-center py-20 bg-white rounded-[2rem] border-2 border-dashed border-slate-200"><Users size={48} className="mx-auto text-slate-300 mb-4"/><p className="text-slate-500 font-medium">Nenhum cliente encontrado.</p></div> : (
                        clientesFiltrados.map(client => {
                            return (
                                <div key={client.id} className="bg-white rounded-[1.2rem] shadow-sm border border-slate-100 hover:border-emerald-200 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group overflow-hidden relative">
                                    <div className={`absolute left-0 top-0 bottom-0 w-1.5 cursor-pointer hover:w-2.5 transition-all ${getStatusColor(client.status_processo)}`} onClick={() => toggleStatus(client)} title="Alterar Status"></div>
                                    <div className="pl-6 p-6">
                                        <div className="flex justify-between items-start mb-6">
                                            <div><h3 className="font-bold text-xl text-slate-800 tracking-tight">{client.nome}</h3></div>
                                        </div>
                                        <div className="flex items-center gap-4 border-t border-slate-100 pt-4 flex-wrap">
                                            <div className="flex gap-2">
                                                <button onClick={() => navigate(`/cliente/${client.id}`)} className="p-2.5 bg-slate-50 text-slate-600 rounded-lg hover:bg-blue-600 hover:text-white transition-colors border border-slate-200" title="Ficha"><UserCog size={18}/></button>
                                                <button onClick={() => window.open(`https://wa.me/55${client.telefone?.replace(/\D/g, '') || ''}`, '_blank')} className="p-2.5 bg-slate-50 text-slate-600 rounded-lg hover:bg-emerald-500 hover:text-white transition-colors border border-slate-200" title="WhatsApp"><MessageCircle size={18}/></button>
                                            </div>
                                            <div className="w-px h-8 bg-slate-200 hidden sm:block"></div>
                                            <div className="flex gap-2">
                                                <button onClick={() => navigate(`/analise/${client.id}`)} className="p-2.5 bg-orange-50 text-orange-600 rounded-lg hover:bg-orange-500 hover:text-white transition-colors border border-orange-100" title="Calculadora"><Calculator size={18}/></button>
                                                <button onClick={() => navigate(`/parecer/${client.id}`)} className="p-2.5 bg-purple-50 text-purple-600 rounded-lg hover:bg-purple-600 hover:text-white transition-colors border border-purple-100" title="Parecer IA"><BrainCircuit size={18}/></button>
                                                <button onClick={() => navigate(`/linha-tempo-visual/${client.id}`)} className="p-2.5 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-600 hover:text-white transition-colors border border-indigo-100" title="Linha do Tempo"><TrendingUp size={18}/></button>
                                            </div>
                                            <div className="w-px h-8 bg-slate-200 hidden sm:block"></div>
                                            <div className="flex gap-2">
                                                <button onClick={() => navigate(`/documentos/${client.id}`)} className="p-2.5 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-600 hover:text-white transition-colors border border-emerald-100" title="GED"><FolderOpen size={18}/></button>
                                                <button onClick={() => navigate(`/procuracao/${client.id}`)} className="p-2.5 bg-teal-50 text-teal-600 rounded-lg hover:bg-teal-600 hover:text-white transition-colors border border-teal-100" title="Procuração"><Printer size={18}/></button>
                                                <button onClick={() => navigate(`/dossie/${client.id}`)} className="p-2.5 bg-cyan-50 text-cyan-600 rounded-lg hover:bg-cyan-600 hover:text-white transition-colors border border-cyan-100" title="Dossiê Completo"><BookCheck size={18}/></button>
                                            </div>
                                            <div className="flex-1"></div>
                                            <button onClick={() => handleDeleteClient(client.id)} className="p-2.5 text-slate-300 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={18}/></button>
                                        </div>
                                    </div>
                                </div>
                            )
                        })
                    )}
                </div>
            </div>

            {/* BARRA LATERAL DIREITA (WIDGETS) */}
            <div className="w-full lg:w-80 space-y-6">
                {/* WIDGET ANIVERSARIANTES */}
                <div className="bg-white rounded-[2rem] shadow-lg shadow-pink-100/50 border border-pink-100 overflow-hidden">
                    <div className="bg-gradient-to-r from-pink-500 to-rose-600 p-5 text-white relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -mr-8 -mt-8 blur-xl"></div>
                        <h3 className="font-bold flex items-center gap-2 relative z-10"><Cake size={18} className="text-pink-200"/> Aniversariantes</h3>
                        <p className="text-xs text-pink-100 opacity-90 relative z-10 mt-1">Mês de {new Date().toLocaleString('pt-BR', { month: 'long' })}</p>
                    </div>
                    <div className="p-5 space-y-4 max-h-80 overflow-y-auto">
                        {aniversariantes.length === 0 ? <div className="text-center text-slate-400 text-xs py-4">Nenhum este mês.</div> : 
                            aniversariantes.map(c => (
                                <div key={c.id} className="flex items-center gap-4 p-3 bg-pink-50/50 rounded-2xl border border-pink-100/50 group hover:bg-pink-50 transition-colors">
                                    <div className="w-12 h-12 rounded-xl bg-white text-pink-600 flex flex-col items-center justify-center font-bold text-xs shadow-sm leading-tight border border-pink-100">
                                        <span className="text-[9px] uppercase tracking-wider text-pink-400">Dia</span>
                                        <span className="text-lg">{c.data_nascimento?.split('-')[2]}</span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-bold text-slate-800 text-sm truncate">{c.nome}</p>
                                        <button onClick={() => window.open(`https://wa.me/55${c.telefone?.replace(/\D/g, '') || ''}`, '_blank')} className="text-[11px] text-pink-600 font-bold hover:underline flex items-center gap-1 mt-0.5">Parabéns WhatsApp</button>
                                    </div>
                                </div>
                            ))
                        }
                    </div>
                </div>

                {/* WIDGET LEMBRETES */}
                <div className="bg-amber-50/50 rounded-[2rem] shadow-sm border border-amber-100 p-6 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-amber-200/20 rounded-full blur-3xl -mr-10 -mt-10"></div>
                    <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2 text-sm relative z-10"><StickyNote size={18} className="text-amber-500"/> Lembretes</h3>
                    <div className="flex gap-2 mb-5 relative z-10">
                        <input value={newNote} onChange={e => setNewNote(e.target.value)} onKeyDown={e => e.key === 'Enter' && addNote()} placeholder="Nova nota..." className="flex-1 bg-white border border-amber-200 rounded-xl px-4 py-2 text-xs outline-none focus:border-amber-400 transition-all"/>
                        <button onClick={addNote} className="bg-amber-400 hover:bg-amber-500 text-amber-900 rounded-xl px-3 py-1 text-lg font-bold transition-colors shadow-sm">+</button>
                    </div>
                    <div className="space-y-3 relative z-10">
                        {notes.length === 0 && <p className="text-xs text-slate-400 italic text-center py-2">Sem lembretes.</p>}
                        {notes.map((note, i) => (
                            <div key={i} className="flex gap-3 items-start text-xs text-slate-700 bg-white p-3 rounded-xl border border-amber-100 shadow-sm group hover:scale-[1.02] transition-transform">
                                <div className="w-2 h-2 rounded-full bg-amber-400 mt-1 shrink-0"></div>
                                <span className="flex-1 break-words font-medium">{note}</span>
                                <button onClick={() => removeNote(i)} className="text-slate-300 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={14}/></button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    </div>
  );
}