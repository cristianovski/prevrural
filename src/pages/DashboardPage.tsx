// src/pages/DashboardPage.tsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Users, UserPlus, Search, Filter, TrendingUp, Clock, Calendar, 
  CheckCircle, AlertCircle, XCircle, ChevronRight, Star, 
  MessageCircle, FileText, Printer, FolderOpen, BrainCircuit,
  Trash2, Edit, Eye, MoreHorizontal, PieChart, BarChart,
  UserCog, Calculator, BookCheck, Briefcase, LogOut, LayoutDashboard,
  Tractor, Scale, FileCheck, UploadCloud, Download, Save, X,
  Plus, ArrowLeft, Paperclip, Link as LinkIcon, Activity, Heart,
  HelpCircle, MapPin, Phone, PenTool, Shield, ShoppingBag, LayoutList,
  BookOpen, Sparkles, Settings, Underline, AlignLeft, AlignCenter,
  AlignJustify, Bold, Italic, List, ListOrdered, Undo, Redo, Indent,
  Outdent, Type, Square, CheckSquare, DollarSign // ← ADICIONADO
} from "lucide-react";
import { supabase } from "../lib/supabase";
import { useToast } from "../hooks/use-toast";
import { Client, BenefitStatus } from "../types";

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
    
    try {
        const savedNotes = localStorage.getItem("dashboardNotes");
        if (savedNotes) setNotes(JSON.parse(savedNotes));
    } catch (error) {
        console.error("Erro ao ler notas do cache", error);
        localStorage.removeItem("dashboardNotes");
    }
  }, []);

  const fetchClients = async () => {
    setLoading(true);
    try {
        const { data, error } = await supabase.from('clients').select('*').order('created_at', { ascending: false });
        if (error) throw error;
        if (data) setClients(data as Client[]);
    } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Erro desconhecido";
        toast({ title: "Erro", description: "Falha ao carregar clientes: " + msg, variant: "destructive" });
    } finally {
        setLoading(false);
    }
  };

  const handleDeleteClient = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("ATENÇÃO: Apagar este cliente removerá tudo (ficha, documentos, histórico). Continuar?")) {
        try {
            const { error } = await supabase.from('clients').delete().eq('id', id);
            if (error) throw error;
            toast({ title: "Sucesso", description: "Cliente removido.", variant: "success" });
            fetchClients();
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : "Erro ao excluir";
            toast({ title: "Erro", description: msg, variant: "destructive" });
        }
    }
  };

  const toggleStatus = async (client: Client, e: React.MouseEvent) => {
    e.stopPropagation();
    const ciclo: BenefitStatus[] = ["A Iniciar", "Em Andamento", "Finalizado"];
    const atual = client.status_processo ?? "A Iniciar";
    const indexAtual = ciclo.indexOf(atual);
    const novoIndex = (indexAtual + 1) % ciclo.length;
    const novoStatus = ciclo[novoIndex];

    setClients(prev => prev.map(c => 
      c.id === client.id ? { ...c, status_processo: novoStatus } : c
    ) as Client[]);

    try {
      const { error } = await supabase
        .from('clients')
        .update({ status_processo: novoStatus })
        .eq('id', client.id);
      if (error) throw error;
      toast({ title: "Status Atualizado", description: `Novo status: ${novoStatus}`, variant: "default" });
    } catch (err) {
      toast({ title: "Erro", description: "Não foi possível atualizar o status.", variant: "destructive" });
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

  const getStatusColor = (status?: BenefitStatus): string => {
      switch(status) {
          case 'Finalizado': return 'bg-emerald-500';
          case 'Em Andamento': return 'bg-blue-500';
          default: return 'bg-amber-400';
      }
  };

  const getStatusBg = (status?: BenefitStatus): string => {
      switch(status) {
          case 'Finalizado': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
          case 'Em Andamento': return 'bg-blue-50 text-blue-700 border-blue-200';
          default: return 'bg-amber-50 text-amber-700 border-amber-200';
      }
  };

  const getStatusIcon = (status?: BenefitStatus) => {
      switch(status) {
          case 'Finalizado': return <CheckCircle size={14} className="text-emerald-600" />;
          case 'Em Andamento': return <Clock size={14} className="text-blue-600" />;
          default: return <AlertCircle size={14} className="text-amber-600" />;
      }
  };

  const clientesFiltrados = clients.filter(c => {
      const s = searchTerm.toLowerCase();
      const matchText = c.nome?.toLowerCase().includes(s) || c.cpf?.includes(s);
      const matchStatus = statusFilter === "Todos" || (c.status_processo || "A Iniciar") === statusFilter;
      return matchText && matchStatus;
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
      const parts = c.data_nascimento.split('-');
      if (parts.length !== 3) return false; 
      const mesNasc = parseInt(parts[1], 10) - 1;
      return mesNasc === mesAtual;
  }).sort((a, b) => parseInt(a.data_nascimento!.split('-')[2], 10) - parseInt(b.data_nascimento!.split('-')[2], 10));

  // Dados para gráfico de pizza (simulado)
  const pieData = [
    { name: 'A Iniciar', value: stats.iniciar, color: '#f59e0b' },
    { name: 'Em Andamento', value: stats.andamento, color: '#3b82f6' },
    { name: 'Finalizado', value: stats.finalizado, color: '#10b981' },
  ];

  return (
    <div className="flex-1 overflow-y-auto bg-gradient-to-br from-slate-50 to-slate-100 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        
        {/* Header com boas-vindas */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Dashboard</h1>
            <p className="text-slate-500 mt-1">Bem-vindo de volta! Aqui está o resumo da sua carteira.</p>
          </div>
          <button 
            onClick={() => navigate('/cliente/novo')}
            className="mt-4 md:mt-0 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white px-6 py-3 rounded-xl font-semibold flex items-center gap-2 shadow-lg shadow-emerald-200/50 transition-all hover:shadow-xl hover:-translate-y-0.5"
          >
            <UserPlus size={20} />
            Novo Cliente
          </button>
        </div>

        {/* Cards de estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:shadow-md transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-emerald-100 rounded-xl text-emerald-600">
                <Users size={24} />
              </div>
              <span className="text-xs font-medium text-slate-400 bg-slate-100 px-2 py-1 rounded-full">Total</span>
            </div>
            <h3 className="text-2xl font-bold text-slate-800">{stats.total}</h3>
            <p className="text-sm text-slate-500 mt-1">Clientes cadastrados</p>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:shadow-md transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-amber-100 rounded-xl text-amber-600">
                <AlertCircle size={24} />
              </div>
              <span className="text-xs font-medium text-amber-600 bg-amber-50 px-2 py-1 rounded-full">{stats.iniciar}</span>
            </div>
            <h3 className="text-2xl font-bold text-slate-800">A Iniciar</h3>
            <p className="text-sm text-slate-500 mt-1">Aguardando análise</p>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:shadow-md transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-blue-100 rounded-xl text-blue-600">
                <Clock size={24} />
              </div>
              <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded-full">{stats.andamento}</span>
            </div>
            <h3 className="text-2xl font-bold text-slate-800">Em Andamento</h3>
            <p className="text-sm text-slate-500 mt-1">Processos ativos</p>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:shadow-md transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-emerald-100 rounded-xl text-emerald-600">
                <CheckCircle size={24} />
              </div>
              <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">{stats.finalizado}</span>
            </div>
            <h3 className="text-2xl font-bold text-slate-800">Finalizados</h3>
            <p className="text-sm text-slate-500 mt-1">Concluídos</p>
          </div>
        </div>

        {/* Gráfico de pizza simulado e filtros */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-1 bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
            <h3 className="font-semibold text-slate-700 mb-4 flex items-center gap-2">
              <PieChart size={18} className="text-slate-400" />
              Distribuição de Processos
            </h3>
            <div className="flex flex-col items-center">
              <div className="relative w-40 h-40 mb-4">
                {/* Simulação de gráfico de pizza com CSS */}
                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-amber-400 via-blue-500 to-emerald-500"
                     style={{ 
                       background: `conic-gradient(
                         #f59e0b 0deg ${(stats.iniciar / stats.total) * 360}deg,
                         #3b82f6 ${(stats.iniciar / stats.total) * 360}deg ${((stats.iniciar + stats.andamento) / stats.total) * 360}deg,
                         #10b981 ${((stats.iniciar + stats.andamento) / stats.total) * 360}deg 360deg
                       )`
                     }}>
                </div>
                <div className="absolute inset-2 bg-white rounded-full flex items-center justify-center">
                  <span className="text-2xl font-bold text-slate-700">{stats.total}</span>
                </div>
              </div>
              <div className="w-full space-y-2">
                {pieData.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                      <span className="text-slate-600">{item.name}</span>
                    </div>
                    <span className="font-medium text-slate-800">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
            <h3 className="font-semibold text-slate-700 mb-4 flex items-center gap-2">
              <Filter size={18} className="text-slate-400" />
              Filtros e Pesquisa
            </h3>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-3.5 text-slate-400" size={20} />
                <input
                  type="text"
                  placeholder="Buscar por nome ou CPF..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all"
                />
              </div>
              <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0">
                {["Todos", "A Iniciar", "Em Andamento", "Finalizado"].map(st => (
                  <button
                    key={st}
                    onClick={() => setStatusFilter(st)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                      statusFilter === st
                        ? 'bg-emerald-600 text-white shadow-md shadow-emerald-200'
                        : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Lista de Clientes */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-slate-800">Últimos Clientes</h2>
            <button
              onClick={() => navigate('/clientes')}
              className="text-emerald-600 hover:text-emerald-700 font-medium text-sm flex items-center gap-1"
            >
              Ver todos <ChevronRight size={16} />
            </button>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 animate-pulse">
                  <div className="h-10 w-10 bg-slate-200 rounded-xl mb-4"></div>
                  <div className="h-5 w-3/4 bg-slate-200 rounded mb-2"></div>
                  <div className="h-4 w-1/2 bg-slate-200 rounded mb-4"></div>
                  <div className="space-y-2">
                    <div className="h-3 w-full bg-slate-200 rounded"></div>
                    <div className="h-3 w-2/3 bg-slate-200 rounded"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : clientesFiltrados.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center border-2 border-dashed border-slate-200">
              <Users size={48} className="mx-auto text-slate-300 mb-4" />
              <h3 className="text-lg font-medium text-slate-700 mb-2">Nenhum cliente encontrado</h3>
              <p className="text-slate-500 mb-4">Que tal cadastrar seu primeiro cliente agora?</p>
              <button
                onClick={() => navigate('/cliente/novo')}
                className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-2 rounded-xl font-medium inline-flex items-center gap-2"
              >
                <UserPlus size={18} />
                Novo Cliente
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {clientesFiltrados.slice(0, 6).map((client) => (
                <div
                  key={client.id}
                  onClick={() => navigate(`/cliente/${client.id}`)}
                  className="bg-white rounded-2xl shadow-sm border border-slate-100 hover:shadow-md hover:border-emerald-200 transition-all cursor-pointer group overflow-hidden relative"
                >
                  {/* Barra lateral de status (clicável para alterar status) */}
                  <div
                    className={`absolute left-0 top-0 bottom-0 w-1.5 cursor-pointer hover:w-2.5 transition-all ${getStatusColor(client.status_processo)}`}
                    onClick={(e) => toggleStatus(client, e)}
                    title="Clique para alterar status"
                  ></div>

                  <div className="pl-6 p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center text-white font-bold text-lg">
                          {client.nome?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <h3 className="font-semibold text-slate-800 group-hover:text-emerald-700 transition-colors">
                            {client.nome}
                          </h3>
                          <p className="text-xs text-slate-500 font-mono mt-0.5">{client.cpf}</p>
                        </div>
                      </div>
                    </div>

                    {/* Informações de contato */}
                    <div className="space-y-2 mb-4 text-sm text-slate-600">
                      <div className="flex items-center gap-2">
                        <MapPin size={14} className="text-slate-400 shrink-0" />
                        <span className="truncate text-xs">{client.cidade || client.endereco || 'Local não informado'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone size={14} className="text-slate-400 shrink-0" />
                        <span className="truncate text-xs">{client.telefone || 'Sem telefone'}</span>
                      </div>
                    </div>

                    {/* Botões de ação (restaurados) */}
                    <div className="flex items-center gap-2 pt-4 border-t border-slate-100 flex-wrap">
                      {/* Grupo 1: Ficha e WhatsApp */}
                      <div className="flex gap-1">
                        <button
                          onClick={(e) => { e.stopPropagation(); navigate(`/cliente/${client.id}`); }}
                          className="p-2 rounded-lg bg-slate-50 text-slate-600 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                          title="Ficha do Cliente"
                        >
                          <UserCog size={16} />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); window.open(`https://wa.me/55${client.telefone?.replace(/\D/g, '') || ''}`, '_blank'); }}
                          className="p-2 rounded-lg bg-slate-50 text-slate-600 hover:bg-emerald-50 hover:text-emerald-600 transition-colors"
                          title="WhatsApp"
                        >
                          <MessageCircle size={16} />
                        </button>
                      </div>

                      <div className="w-px h-6 bg-slate-200"></div>

                      {/* Grupo 2: Calculadora e Parecer IA */}
                      <div className="flex gap-1">
                        <button
                          onClick={(e) => { e.stopPropagation(); navigate(`/analise/${client.id}`); }}
                          className="p-2 rounded-lg bg-slate-50 text-slate-600 hover:bg-amber-50 hover:text-amber-600 transition-colors"
                          title="Calculadora Estratégica"
                        >
                          <Calculator size={16} />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); navigate(`/parecer/${client.id}`); }}
                          className="p-2 rounded-lg bg-slate-50 text-slate-600 hover:bg-purple-50 hover:text-purple-600 transition-colors"
                          title="Parecer IA"
                        >
                          <BrainCircuit size={16} />
                        </button>
                      </div>

                      <div className="w-px h-6 bg-slate-200"></div>

                      {/* Grupo 3: GED, Procuração, Dossiê e Financeiro */}
                      <div className="flex gap-1">
                        <button
                          onClick={(e) => { e.stopPropagation(); navigate(`/documentos/${client.id}`); }}
                          className="p-2 rounded-lg bg-slate-50 text-slate-600 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                          title="Documentos (GED)"
                        >
                          <FolderOpen size={16} />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); navigate(`/procuracao/${client.id}`); }}
                          className="p-2 rounded-lg bg-slate-50 text-slate-600 hover:bg-teal-50 hover:text-teal-600 transition-colors"
                          title="Procuração"
                        >
                          <FileText size={16} />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); navigate(`/dossie/${client.id}`); }}
                          className="p-2 rounded-lg bg-slate-50 text-slate-600 hover:bg-cyan-50 hover:text-cyan-600 transition-colors"
                          title="Dossiê Completo"
                        >
                          <BookCheck size={16} />
                        </button>
                        {/* NOVO BOTÃO FINANCEIRO */}
                        <button
                          onClick={(e) => { e.stopPropagation(); navigate(`/cliente/${client.id}/financeiro`); }}
                          className="p-2 rounded-lg bg-slate-50 text-slate-600 hover:bg-emerald-50 hover:text-emerald-600 transition-colors"
                          title="Financeiro do Cliente"
                        >
                          <DollarSign size={16} />
                        </button>
                      </div>

                      <div className="flex-1"></div>

                      {/* Botão deletar */}
                      <button
                        onClick={(e) => handleDeleteClient(client.id, e)}
                        className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                        title="Excluir cliente"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Barra lateral de aniversariantes e lembretes */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Aniversariantes */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-slate-700 flex items-center gap-2">
                <Calendar size={18} className="text-pink-500" />
                Aniversariantes do Mês
              </h3>
              <span className="text-xs bg-pink-100 text-pink-600 px-2 py-1 rounded-full font-medium">
                {aniversariantes.length}
              </span>
            </div>
            {aniversariantes.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-4">Nenhum aniversariante este mês.</p>
            ) : (
              <div className="space-y-3">
                {aniversariantes.map((c) => (
                  <div key={c.id} className="flex items-center gap-3 p-3 bg-pink-50/50 rounded-xl border border-pink-100">
                    <div className="w-10 h-10 bg-pink-100 rounded-xl flex flex-col items-center justify-center text-pink-600 font-bold">
                      <span className="text-xs leading-none">Dia</span>
                      <span className="text-lg leading-none">{c.data_nascimento?.split('-')[2]}</span>
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-slate-800 text-sm">{c.nome}</p>
                      <button
                        onClick={() => window.open(`https://wa.me/55${c.telefone?.replace(/\D/g, '') || ''}`, '_blank')}
                        className="text-xs text-pink-600 font-medium hover:underline flex items-center gap-1 mt-0.5"
                      >
                        <MessageCircle size={12} /> Enviar parabéns
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Lembretes */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
            <h3 className="font-semibold text-slate-700 flex items-center gap-2 mb-4">
              <Star size={18} className="text-amber-500" />
              Lembretes Rápidos
            </h3>
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addNote()}
                placeholder="Adicionar lembrete..."
                className="flex-1 border border-slate-200 rounded-xl px-4 py-2 text-sm focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 outline-none"
              />
              <button
                onClick={addNote}
                className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-xl font-medium transition-colors"
              >
                Adicionar
              </button>
            </div>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {notes.length === 0 ? (
                <p className="text-sm text-slate-500 text-center py-4">Nenhum lembrete salvo.</p>
              ) : (
                notes.map((note, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100 group">
                    <span className="text-sm text-slate-700">{note}</span>
                    <button
                      onClick={() => removeNote(i)}
                      className="text-slate-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}