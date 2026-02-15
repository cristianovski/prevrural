import { useState, useEffect } from "react";
import { 
  Users, FileText, Plus, Search, LogOut, LayoutDashboard, 
  Trash2, MessageCircle, AlertCircle, CheckCircle,
  Calendar, Edit3, DollarSign, Briefcase, Mail, Lock, 
  BarChart3, ScrollText, BookOpen, Cake, StickyNote, Filter,
  Calculator, BookCopy, BrainCircuit, Activity, ChevronRight
} from "lucide-react";
import { supabase } from "./lib/supabase";

// --- IMPORTAÇÕES ---
import { RuralInterviewPage } from "./pages/analysis/RuralInterviewPage"; 
import { ClientFormPage } from "./pages/clients/ClientFormPage";
import { LegalOpinionPage } from "./pages/clients/LegalOpinionPage"; 
import { TimelinePage } from "./pages/timeline/TimelinePage"; 
import { TimelineVisualPage } from "./pages/timeline/TimelineVisualPage"; 
import { LawyersPage } from "./pages/admin/LawyersPage";
import { DocumentsPage } from "./pages/documents/DocumentsPage";
import { MasterReportPage } from "./pages/analysis/MasterReportPage";
import { AnalysisPage } from "./pages/analysis/AnalysisPage";
import { LibraryPage } from "./pages/admin/LibraryPage";

interface Client {
  id: number;
  nome: string;
  cpf: string;
  telefone?: string;
  honorarios?: number;
  data_protocolo?: string;
  status_processo?: string;
  data_nascimento?: string; 
  sexo?: string; 
  created_at: string;
  nacionalidade?: string;
  estado_civil?: string;
  profissao?: string;
  endereco?: string;
  nome_mae?: string;
  nit?: string;
  ctps?: string;
  rg?: string;
}

function App() {
  const [session, setSession] = useState<any>(null);
  
  const [view, setView] = useState<'dashboard' | 'form' | 'interview' | 'opinion' | 'timeline' | 'timeline_visual' | 'lawyers' | 'procuracao' | 'master' | 'analysis' | 'library'>('dashboard');
  
  const [editingClientId, setEditingClientId] = useState<number | null>(null);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("Todos");

  const [notes, setNotes] = useState<string[]>([]);
  const [newNote, setNewNote] = useState("");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [authLoading, setAuthLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchClients();
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) fetchClients(); else setClients([]);
    });
    const savedNotes = localStorage.getItem("dashboardNotes");
    if (savedNotes) setNotes(JSON.parse(savedNotes));
    return () => subscription.unsubscribe();
  }, []);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    if (authMode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) alert("Erro: " + error.message);
    } else {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) alert("Erro: " + error.message);
        else { alert("Sucesso! Verifique seu email."); setAuthMode('login'); }
    }
    setAuthLoading(false);
  };

  const logout = async () => { await supabase.auth.signOut(); };

  const fetchClients = async () => {
    setLoading(true);
    const { data } = await supabase.from('clients').select('*').order('created_at', { ascending: false });
    if (data) setClients(data);
    setLoading(false);
  };

  const handleDeleteClient = async (id: number) => {
    if (confirm("ATENÇÃO: Apagar este cliente removerá tudo. Continuar?")) {
      await supabase.from('clients').delete().eq('id', id);
      fetchClients();
    }
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

  // --- NAVEGAÇÃO ---
  const goHome = () => { setView('dashboard'); fetchClients(); };
  const openNewClient = () => { setEditingClientId(null); setView('form'); };
  const openEditClient = (id: number) => { setEditingClientId(id); setView('form'); };
  
  const openInterview = (client: Client) => { setSelectedClient(client); setView('interview'); };
  const openOpinion = (client: Client) => { setSelectedClient(client); setView('opinion'); };
  const openTimelineVisual = (client: Client) => { setSelectedClient(client); setView('timeline_visual'); };
  const openTimeline = (client: Client) => { setSelectedClient(client); setView('timeline'); };
  const openProcuracao = (client: Client) => { setSelectedClient(client); setView('procuracao'); };
  const openMasterReport = (client: Client) => { setSelectedClient(client); setView('master'); };
  const openAnalysis = (client: Client) => { setSelectedClient(client); setView('analysis'); };

  const toggleStatus = async (client: Client) => {
      const ciclo = ["A Iniciar", "Em Andamento", "Finalizado"];
      const atual = client.status_processo || "A Iniciar";
      const novo = ciclo[(ciclo.indexOf(atual) + 1) % ciclo.length];
      setClients(prev => prev.map(c => c.id === client.id ? { ...c, status_processo: novo } : c));
      await supabase.from('clients').update({ status_processo: novo }).eq('id', client.id);
  };

  const abrirWhatsApp = (client: Client) => {
      if (!client.telefone) return alert("Telefone não cadastrado.");
      window.open(`https://wa.me/55${client.telefone.replace(/\D/g, '')}`, '_blank');
  };

  const getPrazoStatus = (dataProtocolo?: string) => {
      if (!dataProtocolo) return { label: "Sem Protocolo", color: "text-slate-400 bg-slate-50/50", icon: <Calendar size={12}/> };
      const d = new Date(dataProtocolo); d.setDate(d.getDate() + 45);
      const diff = Math.ceil((d.getTime() - new Date().getTime()) / (86400000));
      if (diff < 0) return { label: `${Math.abs(diff)}d Atraso`, color: "text-red-600 bg-red-50 font-bold", icon: <AlertCircle size={12}/> };
      if (diff <= 15) return { label: `${diff}d Restantes`, color: "text-amber-600 bg-amber-50 font-bold", icon: <AlertCircle size={12}/> };
      return { label: "No Prazo", color: "text-emerald-600 bg-emerald-50 font-bold", icon: <CheckCircle size={12}/> };
  };

  const clientesFiltrados = clients.filter(c => {
      const s = searchTerm.toLowerCase();
      return (c.nome.toLowerCase().includes(s) || c.cpf.includes(s)) && (statusFilter === "Todos" || (c.status_processo || "A Iniciar") === statusFilter);
  });
  
  const totalCarteira = clients.reduce((acc, curr) => acc + Number(curr.honorarios || 0), 0);
  const mesAtual = new Date().getMonth();
  const aniversariantes = clients.filter(c => {
      if (!c.data_nascimento) return false;
      const mesNasc = parseInt(c.data_nascimento.split('-')[1]) - 1;
      return mesNasc === mesAtual;
  }).sort((a, b) => {
      const diaA = parseInt(a.data_nascimento?.split('-')[2] || '0');
      const diaB = parseInt(b.data_nascimento?.split('-')[2] || '0');
      return diaA - diaB;
  });

  const stats = {
      iniciar: clients.filter(c => !c.status_processo || c.status_processo === 'A Iniciar').length,
      andamento: clients.filter(c => c.status_processo === 'Em Andamento').length,
      finalizado: clients.filter(c => c.status_processo === 'Finalizado').length,
      total: clients.length || 1
  };

  // --- ROTEAMENTO ---
  if (view === 'library') return <LibraryPage onBack={goHome} />;
  if (view === 'lawyers') return <LawyersPage onBack={goHome} />;
  if (view === 'procuracao' && selectedClient) return <DocumentsPage onBack={goHome} cliente={selectedClient} />;
  if (view === 'master' && selectedClient) return <MasterReportPage onBack={goHome} cliente={selectedClient} />;
  if (view === 'interview' && selectedClient) return <RuralInterviewPage onBack={goHome} cliente={selectedClient} />;
  if (view === 'opinion' && selectedClient) return <LegalOpinionPage onBack={goHome} clientId={selectedClient.id} />;
  if (view === 'timeline' && selectedClient) return <TimelinePage onBack={goHome} cliente={selectedClient} />;
  if (view === 'analysis' && selectedClient) return <AnalysisPage onBack={goHome} cliente={selectedClient} />;
  if (view === 'timeline_visual' && selectedClient) return <TimelineVisualPage onBack={goHome} cliente={selectedClient} />;
  if (view === 'form') return (
    <ClientFormPage 
        onBack={goHome} 
        clienteId={editingClientId} 
        onOpenAnalysis={(id) => { const client = clients.find(c => c.id === id); if (client) openOpinion(client); }}
        onOpenVisualTimeline={(id) => { const client = clients.find(c => c.id === id); if (client) openTimelineVisual(client); }}
    />
  );

  // TELA DE LOGIN
  if (!session) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-900 p-4 font-sans relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-emerald-900/40 via-slate-900 to-slate-900"></div>
        <div className="bg-white/10 backdrop-blur-xl p-8 rounded-3xl shadow-2xl w-full max-w-sm border border-white/10 relative z-10">
            <div className="w-16 h-16 bg-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-emerald-500/30"><LayoutDashboard className="text-white" size={32}/></div>
            <h1 className="text-2xl font-black text-white mb-2 text-center tracking-tight">PrevRural System</h1>
            <p className="text-slate-400 mb-8 text-sm font-medium text-center">Acesse seu escritório digital</p>
            <form onSubmit={handleAuth} className="space-y-4">
                <div><label className="text-xs font-bold text-slate-400 uppercase ml-1">E-mail</label><div className="relative"><Mail className="absolute left-3 top-3 text-slate-500" size={18}/><input type="email" required className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-800/50 border border-slate-700 text-white outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all placeholder:text-slate-600" value={email} onChange={e => setEmail(e.target.value)} placeholder="seu@email.com"/></div></div>
                <div><label className="text-xs font-bold text-slate-400 uppercase ml-1">Senha</label><div className="relative"><Lock className="absolute left-3 top-3 text-slate-500" size={18}/><input type="password" required className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-800/50 border border-slate-700 text-white outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all placeholder:text-slate-600" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••"/></div></div>
                <button disabled={authLoading} type="submit" className="w-full bg-emerald-500 text-white p-3.5 rounded-xl font-bold hover:bg-emerald-400 transition-all shadow-lg shadow-emerald-500/20">{authLoading ? 'Carregando...' : authMode === 'login' ? 'Entrar no Sistema' : 'Criar Conta'}</button>
            </form>
            <div className="mt-6 text-center"><button onClick={() => setAuthMode(authMode === 'login' ? 'signup' : 'login')} className="text-xs text-emerald-400 font-bold hover:text-emerald-300 transition-colors">{authMode === 'login' ? 'Não tem conta? Cadastre-se' : 'Já tem conta? Entrar'}</button></div>
        </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans text-slate-800 selection:bg-emerald-100 selection:text-emerald-900">
      
      {/* --- SIDEBAR --- */}
      <aside className="w-72 bg-white flex flex-col border-r border-slate-200 hidden md:flex shadow-xl z-20">
        <div className="p-8 border-b border-slate-100 flex items-center gap-4">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center text-white font-bold shadow-lg shadow-emerald-200"><LayoutDashboard size={20}/></div>
            <div><h2 className="font-bold text-slate-800 text-lg leading-none">PrevRural</h2><p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest mt-1">Advocacia</p></div>
        </div>
        
        <nav className="flex-1 p-6 space-y-8 overflow-y-auto">
            <div>
                <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-4 px-2">Principal</div>
                <button onClick={() => setStatusFilter("Todos")} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${statusFilter === "Todos" ? 'bg-emerald-50 text-emerald-700 shadow-sm ring-1 ring-emerald-100' : 'text-slate-600 hover:bg-slate-50'}`}><Users size={18}/> Carteira de Clientes</button>
            </div>

            <div>
                <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-4 px-2">Filtros de Status</div>
                <div className="space-y-1">
                    {["A Iniciar", "Em Andamento", "Finalizado"].map(st => (
                        <button key={st} onClick={() => setStatusFilter(st)} className={`w-full flex items-center justify-between px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${statusFilter === st ? 'bg-slate-100 text-slate-900' : 'text-slate-500 hover:bg-slate-50'}`}>
                            <span className="flex items-center gap-2"><div className={`w-2 h-2 rounded-full ${st === 'Finalizado' ? 'bg-emerald-500' : st === 'Em Andamento' ? 'bg-blue-500' : 'bg-amber-500'}`}></div>{st}</span>
                            {statusFilter === st && <ChevronRight size={14} className="text-slate-400"/>}
                        </button>
                    ))}
                </div>
            </div>
            
            <div>
                <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-4 px-2">Gestão</div>
                <button onClick={() => setView('library')} className="w-full text-slate-500 hover:text-emerald-700 flex items-center gap-3 px-4 py-2.5 text-sm font-medium hover:bg-emerald-50 rounded-lg transition-colors mb-1"><BookCopy size={18}/> Biblioteca de Teses</button>
                <button onClick={() => setView('lawyers')} className="w-full text-slate-500 hover:text-emerald-700 flex items-center gap-3 px-4 py-2.5 text-sm font-medium hover:bg-emerald-50 rounded-lg transition-colors"><Briefcase size={18}/> Equipe & Advogados</button>
            </div>
        </nav>
        
        <div className="p-6 border-t border-slate-100">
            <button onClick={logout} className="w-full text-slate-500 hover:text-red-600 flex items-center gap-3 px-4 py-3 text-sm font-medium hover:bg-red-50 rounded-xl transition-colors"><LogOut size={18}/> Encerrar Sessão</button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden relative bg-slate-50">
        <div className="md:hidden bg-white text-slate-800 p-4 flex justify-between items-center shadow-sm z-30 border-b border-slate-200"><span className="font-bold flex items-center gap-2 text-emerald-700"><LayoutDashboard size={20}/> PrevRural</span><button onClick={logout}><LogOut size={20}/></button></div>
        
        <div className="flex-1 overflow-y-auto p-4 md:p-8 scroll-smooth">
            <div className="max-w-7xl mx-auto pb-20 flex flex-col lg:flex-row gap-8">
                
                {/* COLUNA PRINCIPAL */}
                <div className="flex-1 space-y-8 min-w-0">
                    
                    {/* HERO STATS - ESTILO CARTÃO DE CRÉDITO */}
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

                    {/* BARRA DE PESQUISA */}
                    <div className="flex flex-col md:flex-row gap-4 items-center">
                        <div className="relative flex-1 w-full group">
                            <Search className="absolute left-5 top-4 text-slate-400 group-focus-within:text-emerald-600 transition-colors" size={20}/>
                            <input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Buscar cliente por nome ou CPF..." className="w-full pl-14 pr-6 py-4 rounded-2xl bg-white border border-slate-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all font-medium text-slate-700 shadow-sm group-focus-within:shadow-md"/>
                        </div>
                        <button onClick={openNewClient} className="w-full md:w-auto bg-slate-900 hover:bg-black text-white px-8 py-4 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-xl shadow-slate-900/20 hover:scale-[1.02] transition-all active:scale-95 whitespace-nowrap"><Plus size={20}/> Novo Cliente</button>
                    </div>

                    {/* LISTA DE CLIENTES */}
                    <div className="space-y-4">
                        {loading ? <div className="text-center py-20 text-slate-400">Carregando carteira...</div> : clientesFiltrados.length === 0 ? <div className="text-center py-20 bg-white rounded-[2rem] border-2 border-dashed border-slate-200"><Users size={48} className="mx-auto text-slate-300 mb-4"/><p className="text-slate-500 font-medium">Nenhum cliente encontrado.</p></div> : (
                            clientesFiltrados.map(client => {
                                const prazo = getPrazoStatus(client.data_protocolo);
                                return (
                                <div key={client.id} className="bg-white p-6 rounded-[1.5rem] shadow-sm border border-slate-100 hover:border-emerald-200 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group">
                                    <div className="flex flex-col xl:flex-row items-center gap-6">
                                        
                                        {/* INFO BÁSICA */}
                                        <div className="flex items-center gap-5 flex-1 w-full">
                                            <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-700 font-black text-xl border border-slate-100 shrink-0 group-hover:bg-emerald-50 group-hover:text-emerald-700 transition-colors">
                                                {client.nome.charAt(0).toUpperCase()}
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-center flex-wrap gap-2 mb-1.5">
                                                    <h3 className="font-bold text-lg text-slate-800 truncate">{client.nome}</h3>
                                                    <button onClick={() => toggleStatus(client)} className={`text-[10px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wide border cursor-pointer hover:opacity-80 transition-opacity ${client.status_processo === 'Finalizado' ? 'bg-emerald-100 text-emerald-800 border-emerald-200' : client.status_processo === 'Em Andamento' ? 'bg-blue-100 text-blue-800 border-blue-200' : 'bg-amber-100 text-amber-800 border-amber-200'}`}>
                                                        {client.status_processo || "A Iniciar"}
                                                    </button>
                                                </div>
                                                <div className="flex items-center gap-3 text-xs font-medium text-slate-500">
                                                    <span className="font-mono bg-slate-100 px-2 py-1 rounded-md border border-slate-200 text-slate-600">{client.cpf}</span>
                                                    <div className={`flex items-center gap-1.5 px-2 py-1 rounded-md ${prazo.color}`}>{prazo.icon} {prazo.label}</div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* AÇÕES */}
                                        <div className="flex items-center gap-2 w-full xl:w-auto justify-between xl:justify-end border-t xl:border-t-0 pt-4 xl:pt-0 border-slate-100">
                                            
                                            {/* GRUPO 1: COMUNICAÇÃO (Esquerda no Mobile) */}
                                            <div className="flex gap-1">
                                                <button onClick={() => abrirWhatsApp(client)} className="w-10 h-10 flex items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 hover:bg-emerald-500 hover:text-white hover:border-emerald-500 transition-all" title="WhatsApp"><MessageCircle size={18}/></button>
                                                <button onClick={() => openInterview(client)} className="w-10 h-10 flex items-center justify-center rounded-xl bg-blue-50 text-blue-600 border border-blue-100 hover:bg-blue-500 hover:text-white hover:border-blue-500 transition-all" title="Ficha de Entrevista"><FileText size={18}/></button>
                                            </div>

                                            {/* DIVISOR */}
                                            <div className="w-px h-8 bg-slate-200 mx-1 hidden xl:block"></div>

                                            {/* GRUPO 2: INTELIGÊNCIA (Centro no Mobile) */}
                                            <div className="flex gap-1">
                                                {/* Botão IA */}
                                                <button onClick={() => openOpinion(client)} className="w-10 h-10 flex items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100 hover:bg-indigo-600 hover:text-white hover:border-indigo-600 transition-all" title="Análise IA & Parecer"><BrainCircuit size={18}/></button>
                                                
                                                {/* ✅ Botão Gráfico Visual (Restaurado e Estilizado) */}
                                                <button onClick={() => openTimelineVisual(client)} className="w-10 h-10 flex items-center justify-center rounded-xl bg-orange-50 text-orange-600 border border-orange-100 hover:bg-orange-500 hover:text-white hover:border-orange-500 transition-all" title="Linha do Tempo Visual"><Activity size={18}/></button>
                                                
                                                <button onClick={() => openTimeline(client)} className="w-10 h-10 flex items-center justify-center rounded-xl bg-purple-50 text-purple-600 border border-purple-100 hover:bg-purple-600 hover:text-white hover:border-purple-600 transition-all" title="Linha do Tempo (Docs)"><BarChart3 size={18}/></button>
                                            </div>

                                            {/* GRUPO 3: GESTÃO (Direita no Mobile) */}
                                            <div className="flex gap-1">
                                                <button onClick={() => openProcuracao(client)} className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-800 hover:text-white hover:border-slate-800 transition-all" title="Documentos"><BookOpen size={18}/></button>
                                                <button onClick={() => openEditClient(client.id)} className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-50 text-slate-400 border border-slate-200 hover:bg-slate-100 hover:text-slate-700 transition-all" title="Editar"><Edit3 size={18}/></button>
                                                <button onClick={() => handleDeleteClient(client.id)} className="w-10 h-10 flex items-center justify-center rounded-xl bg-red-50 text-red-400 border border-red-100 hover:bg-red-500 hover:text-white hover:border-red-500 transition-all" title="Excluir"><Trash2 size={18}/></button>
                                            </div>

                                        </div>
                                    </div>
                                </div>
                            )})
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
                            <p className="text-xs text-pink-100 opacity-90 relative z-10 mt-1">Clientes fazendo anos em {new Date().toLocaleString('pt-BR', { month: 'long' })}</p>
                        </div>
                        <div className="p-5 space-y-4 max-h-80 overflow-y-auto">
                            {aniversariantes.length === 0 ? (
                                <div className="text-center text-slate-400 text-xs py-4">Nenhum aniversariante este mês.</div>
                            ) : (
                                aniversariantes.map(c => {
                                    const dia = c.data_nascimento?.split('-')[2];
                                    return (
                                        <div key={c.id} className="flex items-center gap-4 p-3 bg-pink-50/50 rounded-2xl border border-pink-100/50 group hover:bg-pink-50 transition-colors">
                                            <div className="w-12 h-12 rounded-xl bg-white text-pink-600 flex flex-col items-center justify-center font-bold text-xs shadow-sm leading-tight border border-pink-100">
                                                <span className="text-[9px] uppercase tracking-wider text-pink-400">Dia</span>
                                                <span className="text-lg">{dia}</span>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-bold text-slate-800 text-sm truncate">{c.nome}</p>
                                                <button onClick={() => abrirWhatsApp(c)} className="text-[11px] text-pink-600 font-bold hover:underline flex items-center gap-1 mt-0.5">Enviar Parabéns</button>
                                            </div>
                                        </div>
                                    )
                                })
                            )}
                        </div>
                    </div>

                    {/* WIDGET LEMBRETES */}
                    <div className="bg-amber-50/50 rounded-[2rem] shadow-sm border border-amber-100 p-6 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-amber-200/20 rounded-full blur-3xl -mr-10 -mt-10"></div>
                        <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2 text-sm relative z-10"><StickyNote size={18} className="text-amber-500"/> Lembretes Rápidos</h3>
                        <div className="flex gap-2 mb-5 relative z-10">
                            <input value={newNote} onChange={e => setNewNote(e.target.value)} onKeyDown={e => e.key === 'Enter' && addNote()} placeholder="Nova nota..." className="flex-1 bg-white border border-amber-200 rounded-xl px-4 py-2 text-xs outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-200 transition-all"/>
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
      </main>
    </div>
  );
}

export default App;