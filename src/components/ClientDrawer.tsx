import { useState, useEffect } from "react";
import { User, X, MapPin, Heart, Search, Save, AlertTriangle, AlertCircle, Phone, Users, Cross, FileText, Baby, Briefcase, GraduationCap, Map } from "lucide-react";
import { salvarCliente } from "../lib/supabase";

interface ClientDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  clientData: any;
  setClientData: (data: any) => void;
}

export function ClientDrawer({ isOpen, onClose, clientData, setClientData }: ClientDrawerProps) {
  const [loadingCep, setLoadingCep] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Garante que data nunca seja null para evitar Tela Branca
  const data = clientData || {};

  // Estados de Validação
  const [cpfInvalido, setCpfInvalido] = useState(false);
  const [rgAntigo, setRgAntigo] = useState(false);

  // --- MÁSCARAS ---
  const maskCPF = (v: string) => v.replace(/\D/g, "").replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d{1,2})$/, "$1-$2").slice(0, 14);
  const maskNIT = (v: string) => v.replace(/\D/g, "").replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{5})(\d)/, "$1.$2").replace(/(\d{2})/, "-$1").slice(0, 14);
  const maskPhone = (v: string) => v.replace(/\D/g, "").replace(/^(\d{2})(\d)/g, "($1) $2").replace(/(\d)(\d{4})$/, "$1-$2").slice(0, 15);
  const maskCEP = (v: string) => v.replace(/\D/g, "").replace(/^(\d{5})(\d)/, "$1-$2").slice(0, 9);

  // --- VALIDAÇÕES ---
  const validarCPF = (cpf: string) => {
    cpf = cpf.replace(/[^\d]+/g, '');
    if (cpf === '') return false;
    if (cpf.length !== 11 || /^(\d)\1+$/.test(cpf)) return false;
    let add = 0;
    for (let i = 0; i < 9; i++) add += parseInt(cpf.charAt(i)) * (10 - i);
    let rev = 11 - (add % 11);
    if (rev === 10 || rev === 11) rev = 0;
    if (rev !== parseInt(cpf.charAt(9))) return false;
    add = 0;
    for (let i = 0; i < 10; i++) add += parseInt(cpf.charAt(i)) * (11 - i);
    rev = 11 - (add % 11);
    if (rev === 10 || rev === 11) rev = 0;
    if (rev !== parseInt(cpf.charAt(10))) return false;
    return true;
  };

  const handleBlurCPF = () => {
    if (data.cpf) setCpfInvalido(!validarCPF(data.cpf));
    else setCpfInvalido(false);
  };

  useEffect(() => {
    if (data.dataExpedicao) {
        const dataEmissao = new Date(data.dataExpedicao);
        const hoje = new Date();
        setRgAntigo((hoje.getFullYear() - dataEmissao.getFullYear()) >= 10);
    } else setRgAntigo(false);
  }, [data.dataExpedicao]);

  const buscarCep = async (cep: string) => {
    const cepLimpo = cep.replace(/\D/g, "");
    if (cepLimpo.length !== 8) return;
    setLoadingCep(true);
    try {
      const res = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`);
      const apiData = await res.json();
      if (!apiData.erro) {
        setClientData((prev: any) => ({
          ...prev,
          endereco: apiData.logradouro.toUpperCase(),
          bairro: apiData.bairro.toUpperCase(),
          cidade: apiData.localidade.toUpperCase(),
          uf: apiData.uf.toUpperCase()
        }));
      }
    } catch (e) { console.error(e); } 
    finally { setLoadingCep(false); }
  };

  const handleSalvar = async () => {
    if (!data.nome || !data.cpf) return alert("Nome e CPF são obrigatórios.");
    if (cpfInvalido) return alert("Corrija o CPF antes de salvar.");
    
    setIsSaving(true);
    const res = await salvarCliente(data, null, data.id);
    setIsSaving(false);

    if (res && res[0]?.id) {
        setClientData({ ...data, id: res[0].id });
        alert("✅ Cadastro salvo com sucesso!");
        onClose();
    }
  };

  // Se não estiver aberto ou não tiver dados (segurança extra), não renderiza nada
  if (!isOpen) return null;

  // Lógica de Exibição
  const isCasado = ["casado", "uniao_estavel"].includes(data.estadoCivil);
  const isViuvo = data.estadoCivil === "viuvo";
  const showConjugeData = isCasado || (isViuvo && data.falecidoEraSegurado === "sim");

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm transition-all duration-300">
      <div className="w-full max-w-3xl h-full bg-slate-50 shadow-2xl flex flex-col border-l border-gray-200 animate-in slide-in-from-right duration-300">
        
        {/* HEADER */}
        <div className="px-8 py-6 bg-white border-b border-gray-200 flex justify-between items-center shadow-sm z-10">
          <div>
            <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
              <div className="bg-blue-600 p-2 rounded-lg shadow-blue-200 shadow-lg">
                <User size={24} className="text-white" />
              </div>
              {data.nome || "Novo Cadastro"}
            </h2>
            <p className="text-xs text-slate-500 mt-1 uppercase tracking-widest font-semibold ml-1">Ficha de Identificação Civil</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-red-500 transition-colors">
            <X size={28} strokeWidth={1.5} />
          </button>
        </div>

        {/* CORPO SCROLLÁVEL */}
        <div className="flex-1 overflow-y-auto p-8 space-y-8">
            
            {/* 1. CARTÃO IDENTIFICAÇÃO */}
            <section className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="bg-slate-50/80 px-6 py-4 border-b border-slate-100 flex items-center gap-2">
                    <FileText size={18} className="text-blue-600"/> 
                    <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide">Dados Pessoais</h3>
                </div>
                
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="md:col-span-2">
                        <label className="label-form">Nome Completo *</label>
                        <input type="text" className="input-field font-semibold text-slate-800" placeholder="NOME DO CLIENTE" value={data.nome || ""} onChange={e => setClientData({...data, nome: e.target.value.toUpperCase()})} />
                    </div>
                    
                    <div className="relative">
                        <label className="label-form flex justify-between">CPF * {cpfInvalido && <span className="text-red-500 text-[10px] flex items-center gap-1"><AlertCircle size={10}/> Inválido</span>}</label>
                        <input type="text" className={`input-field font-mono ${cpfInvalido ? "border-red-300 bg-red-50 focus:border-red-500 text-red-700" : ""}`} placeholder="000.000.000-00" value={data.cpf || ""} onChange={e => {setClientData({...data, cpf: maskCPF(e.target.value)}); if(cpfInvalido) setCpfInvalido(false);}} onBlur={handleBlurCPF} />
                    </div>

                    <div>
                        <label className="label-form flex items-center gap-1"><Baby size={14} className="text-slate-400"/> Data de Nascimento</label>
                        <input type="date" className="input-field" value={data.nascimento || ""} onChange={e => setClientData({...data, nascimento: e.target.value})} />
                    </div>

                    {/* BLOCO RG COMPACTO */}
                    <div className="md:col-span-2 bg-slate-50 p-4 rounded-xl border border-slate-200 grid grid-cols-3 gap-4">
                        <div className="col-span-3 text-xs font-bold text-slate-500 uppercase mb-1">Documento de Identidade (RG)</div>
                        <div>
                            <input type="text" className="input-sm bg-white" placeholder="Número" value={data.rg || ""} onChange={e => setClientData({...data, rg: e.target.value.toUpperCase()})} />
                        </div>
                        <div>
                            <input type="text" className="input-sm bg-white" placeholder="Órgão (SSP/BA)" value={data.orgaoEmissor || ""} onChange={e => setClientData({...data, orgaoEmissor: e.target.value.toUpperCase()})} />
                        </div>
                        <div>
                            <input type="date" className="input-sm bg-white" title="Data de Expedição" value={data.dataExpedicao || ""} onChange={e => setClientData({...data, dataExpedicao: e.target.value})} />
                        </div>
                        {rgAntigo && <div className="col-span-3 text-[11px] text-amber-700 bg-amber-50 px-3 py-2 rounded-lg border border-amber-200 flex items-center gap-2"><AlertTriangle size={14}/> <strong>Atenção:</strong> RG com mais de 10 anos.</div>}
                    </div>

                    <div>
                        <label className="label-form">NIT / PIS / PASEP</label>
                        <input type="text" className="input-field font-mono" placeholder="000.00000.00-0" value={data.nit || ""} onChange={e => setClientData({...data, nit: maskNIT(e.target.value)})} />
                    </div>
                    <div>
                        <label className="label-form">Apelido (Testemunhas)</label>
                        <input type="text" className="input-field" placeholder="Ex: ZÉ DA ROÇA" value={data.apelido || ""} onChange={e => setClientData({...data, apelido: e.target.value})} />
                    </div>
                    <div>
                        <label className="label-form flex items-center gap-1"><Briefcase size={14} className="text-slate-400"/> Profissão</label>
                        <input type="text" className="input-field uppercase" placeholder="Ex: LAVRADOR" value={data.profissao || ""} onChange={e => setClientData({...data, profissao: e.target.value.toUpperCase()})} />
                    </div>
                    <div>
                        <label className="label-form flex items-center gap-1"><GraduationCap size={14} className="text-slate-400"/> Escolaridade</label>
                        <select className="input-field" value={data.escolaridade || "alfabetizado"} onChange={e => setClientData({...data, escolaridade: e.target.value})}>
                            <option value="analfabeto">Analfabeto (Assina a Rogo)</option>
                            <option value="alfabetizado">Alfabetizado (Lê pouco)</option>
                            <option value="fundamental_inc">Fundamental Incompleto</option>
                            <option value="fundamental_comp">Fundamental Completo</option>
                            <option value="medio_comp">Ensino Médio</option>
                        </select>
                    </div>
                    <div className="md:col-span-2 grid grid-cols-2 gap-6 pt-4 border-t border-slate-100">
                        <div>
                            <label className="label-form">Nome da Mãe</label>
                            <input type="text" className="input-field uppercase" value={data.nomeMae || ""} onChange={e => setClientData({...data, nomeMae: e.target.value.toUpperCase()})} />
                        </div>
                        <div>
                            <label className="label-form">Nome do Pai</label>
                            <input type="text" className="input-field uppercase" value={data.nomePai || ""} onChange={e => setClientData({...data, nomePai: e.target.value.toUpperCase()})} />
                        </div>
                    </div>
                </div>
            </section>

            {/* 2. ESTADO CIVIL & FAMÍLIA - CARD DINÂMICO */}
            <section className={`rounded-2xl shadow-sm border overflow-hidden transition-all duration-500 ${showConjugeData ? "bg-blue-50/50 border-blue-200" : "bg-white border-slate-200"}`}>
                <div className={`px-6 py-4 border-b flex items-center gap-2 ${showConjugeData ? "border-blue-100 text-blue-800" : "border-slate-100 text-slate-700 bg-slate-50/80"}`}>
                    <Heart size={18} className={showConjugeData ? "text-blue-600 fill-blue-100" : "text-slate-400"}/>
                    <h3 className="text-sm font-bold uppercase tracking-wide">Estado Civil & Família</h3>
                </div>

                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="label-form">Estado Civil Atual</label>
                        <select className="input-field" value={data.estadoCivil || "solteiro"} onChange={e => setClientData({...data, estadoCivil: e.target.value})}>
                            <option value="solteiro">Solteiro(a)</option>
                            <option value="casado">Casado(a) (Civil)</option>
                            <option value="uniao_estavel">União Estável</option>
                            <option value="divorciado">Divorciado(a)</option>
                            <option value="viuvo">Viúvo(a)</option>
                        </select>
                    </div>

                    {/* Datas de União */}
                    {isCasado && (
                        <div className="animate-in fade-in">
                            <label className="label-form">{data.estadoCivil === 'casado' ? 'Data do Casamento' : 'Início da Convivência'}</label>
                            <input type="date" className="input-field bg-white" value={data.dataInicioUniao || ""} onChange={e => setClientData({...data, dataInicioUniao: e.target.value})} />
                        </div>
                    )}

                    {/* Lógica Viúvo */}
                    {isViuvo && (
                        <div className="md:col-span-2 bg-white p-4 rounded-xl border border-slate-200 flex flex-col md:flex-row gap-6 items-center animate-in fade-in">
                            <div className="flex-1">
                                <label className="label-form mb-2 text-slate-600">O falecido era segurado/aposentado?</label>
                                <div className="flex gap-3">
                                    <label className={`flex items-center gap-2 px-4 py-2 rounded-lg border cursor-pointer transition-all ${data.falecidoEraSegurado === "sim" ? "bg-blue-100 border-blue-300 text-blue-800 font-bold" : "bg-white border-slate-200 text-slate-600"}`}>
                                        <input type="radio" name="falecidoSegurado" value="sim" checked={data.falecidoEraSegurado === "sim"} onChange={e => setClientData({...data, falecidoEraSegurado: e.target.value})} className="hidden"/>
                                        <span>Sim</span>
                                    </label>
                                    <label className={`flex items-center gap-2 px-4 py-2 rounded-lg border cursor-pointer transition-all ${data.falecidoEraSegurado === "nao" ? "bg-slate-100 border-slate-300 text-slate-800 font-bold" : "bg-white border-slate-200 text-slate-600"}`}>
                                        <input type="radio" name="falecidoSegurado" value="nao" checked={data.falecidoEraSegurado === "nao"} onChange={e => setClientData({...data, falecidoEraSegurado: e.target.value})} className="hidden"/>
                                        <span>Não</span>
                                    </label>
                                </div>
                            </div>
                            {data.falecidoEraSegurado === "sim" && (
                                <div className="w-full md:w-auto animate-in slide-in-from-right">
                                    <label className="label-form text-red-600 flex items-center gap-1"><Cross size={12}/> Data do Óbito (Fato Gerador)</label>
                                    <input type="date" className="input-field border-red-200 focus:border-red-500 focus:ring-red-100 bg-red-50/10" value={data.dataObitoConjuge || ""} onChange={e => setClientData({...data, dataObitoConjuge: e.target.value})} />
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* DADOS ESPELHADOS */}
                {showConjugeData && (
                    <div className="px-6 pb-6 animate-in slide-in-from-top-4">
                        <div className="relative flex py-3 items-center mb-2">
                            <div className="flex-grow border-t border-blue-200"></div>
                            <span className="flex-shrink-0 mx-4 text-[10px] font-bold text-blue-500 uppercase tracking-widest bg-white px-2 py-1 rounded border border-blue-100 shadow-sm">
                                {isViuvo ? "Dados do Falecido (Instituidor)" : "Dados do Cônjuge / Companheiro"}
                            </span>
                            <div className="flex-grow border-t border-blue-200"></div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-white p-5 rounded-xl border border-blue-100 shadow-sm">
                            <div className="md:col-span-2">
                                <label className="label-mini text-blue-400">NOME COMPLETO</label>
                                <input type="text" className="input-ghost uppercase text-blue-900" placeholder="Nome..." value={data.nomeConjuge || ""} onChange={e => setClientData({...data, nomeConjuge: e.target.value.toUpperCase()})} />
                            </div>
                            <div>
                                <label className="label-mini text-blue-400">CPF</label>
                                <input type="text" className="input-ghost font-mono text-blue-900" placeholder="000.000.000-00" value={data.cpfConjuge || ""} onChange={e => setClientData({...data, cpfConjuge: maskCPF(e.target.value)})} />
                            </div>
                            <div>
                                <label className="label-mini text-blue-400">RG / ÓRGÃO</label>
                                <input type="text" className="input-ghost uppercase text-blue-900" value={data.rgConjuge || ""} onChange={e => setClientData({...data, rgConjuge: e.target.value.toUpperCase()})} />
                            </div>
                            <div>
                                <label className="label-mini text-blue-400">NASCIMENTO</label>
                                <input type="date" className="input-ghost text-blue-900" value={data.nascimentoConjuge || ""} onChange={e => setClientData({...data, nascimentoConjuge: e.target.value})} />
                            </div>
                            <div>
                                <label className="label-mini text-blue-400">NIT / PIS</label>
                                <input type="text" className="input-ghost font-mono text-blue-900" value={data.nitConjuge || ""} onChange={e => setClientData({...data, nitConjuge: maskNIT(e.target.value)})} />
                            </div>
                            <div className="md:col-span-2 grid grid-cols-2 gap-4 pt-2 border-t border-blue-50">
                                <input type="text" className="input-ghost text-xs" placeholder="NOME DA MÃE" value={data.maeConjuge || ""} onChange={e => setClientData({...data, maeConjuge: e.target.value.toUpperCase()})} />
                                <input type="text" className="input-ghost text-xs" placeholder="NOME DO PAI" value={data.paiConjuge || ""} onChange={e => setClientData({...data, paiConjuge: e.target.value.toUpperCase()})} />
                            </div>
                        </div>
                    </div>
                )}
            </section>

            {/* 3. LOCALIZAÇÃO & CONTATO */}
            <section className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="bg-slate-50/80 px-6 py-4 border-b border-slate-100 flex items-center gap-2">
                    <Map size={18} className="text-emerald-600"/> 
                    <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide">Endereço & Contato</h3>
                </div>
                
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="relative">
                        <label className="label-form">CEP</label>
                        <input type="text" className="input-field pr-10 font-mono" placeholder="00000-000" value={data.cep || ""} onChange={e => setClientData({...data, cep: maskCEP(e.target.value)})} onBlur={e => buscarCep(e.target.value)} />
                        {loadingCep ? <div className="absolute right-3 top-9 w-4 h-4 border-2 border-emerald-500 rounded-full animate-spin border-t-transparent"></div> : <Search size={16} className="absolute right-3 top-9 text-slate-400"/>}
                    </div>
                    <div>
                        <label className="label-form">Cidade / UF</label>
                        <input type="text" className="input-field bg-slate-50 text-slate-500 cursor-not-allowed border-slate-200" readOnly value={data.cidade ? `${data.cidade}-${data.uf}` : ""} />
                    </div>
                    <div className="md:col-span-2">
                        <label className="label-form flex items-center gap-1"><MapPin size={14} className="text-slate-400"/> Endereço / Comunidade Rural</label>
                        <input type="text" className="input-field uppercase" placeholder="RUA, SÍTIO, FAZENDA..." value={data.endereco || ""} onChange={e => setClientData({...data, endereco: e.target.value.toUpperCase()})} />
                    </div>
                    <div className="md:col-span-2">
                        <label className="label-form">Ponto de Referência</label>
                        <input type="text" className="input-field uppercase" value={data.pontoReferencia || ""} onChange={e => setClientData({...data, pontoReferencia: e.target.value.toUpperCase()})} />
                    </div>
                    <div>
                        <label className="label-form">Celular (WhatsApp)</label>
                        <div className="relative">
                            <Phone className="absolute left-3 top-3.5 text-emerald-600 w-4 h-4" />
                            <input type="text" className="input-field pl-10 font-medium" placeholder="(00) 00000-0000" value={data.telefone || ""} onChange={e => setClientData({...data, telefone: maskPhone(e.target.value)})} />
                        </div>
                    </div>

                    {/* CONTATO DE RECADO */}
                    <div className="md:col-span-2 bg-slate-50 p-5 rounded-xl border border-dashed border-slate-300 grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
                        <div className="col-span-1 md:col-span-3 text-xs font-bold text-slate-500 uppercase flex gap-2 items-center mb-1"><Users size={14}/> Contato para Recado (Importante)</div>
                        <input type="text" className="input-sm bg-white" placeholder="Nome da Pessoa" value={data.nomeRecado || ""} onChange={e => setClientData({...data, nomeRecado: e.target.value})} />
                        <select className="input-sm bg-white" value={data.parentescoRecado || ""} onChange={e => setClientData({...data, parentescoRecado: e.target.value})}>
                            <option value="">Vínculo...</option>
                            <option value="Vizinho">Vizinho(a)</option>
                            <option value="Filho">Filho(a)</option>
                            <option value="Neto">Neto(a)</option>
                            <option value="Irmão">Irmão(ã)</option>
                            <option value="Agente">Agente de Saúde</option>
                            <option value="Outro">Outro</option>
                        </select>
                        <input type="text" className="input-sm bg-white" placeholder="Telefone Recado" value={data.telefoneRecado || ""} onChange={e => setClientData({...data, telefoneRecado: maskPhone(e.target.value)})} />
                    </div>
                </div>
            </section>

        </div>

        {/* FOOTER */}
        <div className="p-6 bg-white border-t border-slate-200 z-20 flex justify-end gap-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
            <button onClick={onClose} className="px-6 py-3 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 hover:text-slate-800 transition-colors" disabled={isSaving}>
                Cancelar
            </button>
            <button onClick={handleSalvar} disabled={isSaving} className="px-8 py-3 rounded-xl bg-slate-900 text-white font-bold shadow-lg shadow-slate-200 hover:bg-slate-800 transform active:scale-95 transition-all flex items-center gap-2">
                <Save size={18} /> {isSaving ? "Salvando..." : "Salvar Cadastro"}
            </button>
        </div>

      </div>
      
      {/* ESTILOS CSS INLINE */}
      <style>{`
        .input-field { @apply w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-slate-800 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all placeholder:text-slate-300 text-sm hover:border-slate-300; }
        .input-ghost { @apply w-full bg-transparent border-b border-blue-100 px-2 py-1 text-sm focus:border-blue-400 outline-none transition-all placeholder:text-blue-200; }
        .input-sm { @apply w-full border border-slate-200 rounded-lg px-3 py-2 text-slate-800 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all; }
        .label-form { @apply text-xs font-bold text-slate-500 uppercase tracking-wide block mb-1.5 ml-1; }
        .label-mini { @apply text-[10px] font-bold uppercase block mb-1 ml-0.5 tracking-wider; }
      `}</style>
    </div>
  );
}