import { useEffect, useState } from "react";
import { X, Search, Calendar, CheckCircle, XCircle, Trash2 } from "lucide-react";
import { supabase, excluirCliente } from "../lib/supabase";

interface ClientListProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectClient: (client: any) => void;
}

export function ClientList({ isOpen, onClose, onSelectClient }: ClientListProps) {
  const [clientes, setClientes] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [busca, setBusca] = useState("");

  useEffect(() => {
    if (isOpen) buscarClientes();
  }, [isOpen]);

  async function buscarClientes() {
    setLoading(true);
    const { data, error } = await supabase
      .from('clientes')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error) setClientes(data || []);
    setLoading(false);
  }

  // Função para deletar item da lista
  async function handleDelete(id: string, e: React.MouseEvent) {
    e.stopPropagation(); // Impede que o clique abra o cliente
    if (confirm("Tem certeza que deseja excluir este histórico permanentemente?")) {
      const sucesso = await excluirCliente(id);
      if (sucesso) buscarClientes(); // Recarrega a lista
    }
  }

  const clientesFiltrados = clientes.filter(c => 
    c.nome.toLowerCase().includes(busca.toLowerCase()) || 
    c.cpf.includes(busca)
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-background w-full max-w-2xl rounded-2xl shadow-2xl border border-border overflow-hidden flex flex-col max-h-[80vh]">
        
        {/* HEADER */}
        <div className="p-5 border-b border-border flex justify-between items-center bg-secondary/30">
          <div>
            <h2 className="text-xl font-semibold text-foreground">Histórico</h2>
            <p className="text-sm text-muted-foreground">Gerencie seus atendimentos salvos.</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors text-muted-foreground hover:text-destructive">
            <X size={20} />
          </button>
        </div>

        {/* BUSCA */}
        <div className="p-4 border-b border-border bg-background">
          <div className="relative">
            <Search className="absolute left-3 top-3 text-muted-foreground h-4 w-4" />
            <input 
              type="text" 
              placeholder="Buscar por nome ou CPF..." 
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-secondary/50 border border-input rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm"
            />
          </div>
        </div>

        {/* LISTA */}
        <div className="overflow-y-auto flex-1 p-2 space-y-2">
          {loading ? (
            <div className="text-center py-10 text-muted-foreground animate-pulse">Carregando...</div>
          ) : clientesFiltrados.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">Nenhum registro encontrado.</div>
          ) : (
            clientesFiltrados.map((cliente) => (
              <div 
                key={cliente.id}
                className="group flex items-center justify-between p-4 rounded-xl hover:bg-secondary/50 border border-transparent hover:border-border transition-all cursor-pointer"
                onClick={() => {
                   const dadosRecuperados = {
                      id: cliente.id,
                      nome: cliente.nome,
                      cpf: cliente.cpf,
                      nascimento: cliente.nascimento,
                      genero: cliente.genero,
                      possuiTerra: cliente.dados_rurais?.possuiTerra,
                      tamanhoTerra: cliente.dados_rurais?.tamanhoTerra,
                      documentos: cliente.dados_rurais?.documentos,
                   };
                   onSelectClient(dadosRecuperados);
                   onClose();
                }}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    cliente.resultado_analise?.status === "APROVADO" 
                      ? "bg-emerald-100 text-emerald-600" 
                      : "bg-red-100 text-red-600"
                  }`}>
                    {cliente.resultado_analise?.status === "APROVADO" 
                      ? <CheckCircle size={20} /> 
                      : <XCircle size={20} />
                    }
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">{cliente.nome}</h3>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                       <span className="font-mono">{cliente.cpf}</span>
                       <span className="flex items-center gap-1"><Calendar size={10} /> {new Date(cliente.created_at).toLocaleDateString('pt-BR')}</span>
                    </div>
                  </div>
                </div>
                
                {/* BOTÃO EXCLUIR */}
                <button 
                  onClick={(e) => handleDelete(cliente.id, e)}
                  className="p-2 text-muted-foreground hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Excluir Permanentemente"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}