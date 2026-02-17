import { useEffect, useState } from 'react';
import { Routes, Route, Navigate, useParams } from 'react-router-dom';
import { supabase } from './lib/supabase';
import { Toaster } from './components/ui/toaster';

// Layout e Autenticação
import { Layout } from './components/Layout';
import { LoginPage } from './components/LoginPage';
import { ProtectedRoute } from './components/ProtectedRoute';

// Páginas
import { DashboardPage } from './pages/DashboardPage';
import { ClientListPage } from './pages/clients/ClientListPage';
import { ClientFormPage } from './pages/clients/ClientFormPage';
import { AnalysisPage } from './pages/analysis/AnalysisPage';
import { LegalOpinionPage } from './pages/clients/LegalOpinionPage';
import { MasterReportPage } from './pages/analysis/MasterReportPage'; // Dossiê
import { TimelinePage } from './pages/timeline/TimelinePage';
import { TimelineVisualPage } from './pages/timeline/TimelineVisualPage';
import { ClientDocumentsManager } from './pages/documents/ClientDocumentsManager';
import { ProcuracaoPrint } from './pages/documents/ProcuracaoPrint';
import { DocumentsPage } from './pages/documents/DocumentsPage'; // Editor
import { LibraryPage } from './pages/admin/LibraryPage';
import { LawyersPage } from './pages/admin/LawyersPage';

// --- WRAPPER DE CARREGAMENTO DE CLIENTE ---
// Este componente intermediário busca os dados do cliente com base no ID da URL
// e passa para os componentes que esperam receber o objeto "cliente" pronto.
function ClientLoader({ Component }: { Component: any }) {
  const { id } = useParams();
  const [client, setClient] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) { 
        setLoading(false); 
        return; 
    }
    
    const fetchClient = async () => {
        const { data, error } = await supabase
            .from('clients')
            .select('*')
            .eq('id', id)
            .single();
            
        if (data) setClient(data);
        if (error) console.error("Erro ao carregar cliente:", error);
        setLoading(false);
    };

    fetchClient();
  }, [id]);

  if (loading) return <div className="h-full flex items-center justify-center text-slate-400">Carregando contexto do cliente...</div>;
  
  if (!client && id) return <div className="p-8 text-center">Cliente não encontrado.</div>;

  return <Component 
    cliente={client} 
    clienteId={client?.id} // Compatibilidade com componentes que usam clienteId
    clientId={client?.id}  // Compatibilidade com componentes que usam clientId
    onBack={() => window.history.back()} 
  />;
}

function App() {
  return (
    <>
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<Layout />}>
            <Route index element={<DashboardPage />} />
            <Route path="clientes" element={<ClientListPage />} />

            {/* Rotas de Cliente */}
            <Route path="cliente/novo" element={<ClientFormPage onBack={() => window.history.back()} clienteId={null} />} />
            <Route path="cliente/:id" element={<ClientLoader Component={ClientFormPage} />} />

            {/* Ferramentas Jurídicas */}
            <Route path="analise/:id" element={<ClientLoader Component={AnalysisPage} />} />
            <Route path="parecer/:id" element={<ClientLoader Component={LegalOpinionPage} />} />
            <Route path="dossie/:id" element={<ClientLoader Component={MasterReportPage} />} />

            {/* Linha do Tempo e Documentos */}
            <Route path="linha-tempo/:id" element={<ClientLoader Component={TimelinePage} />} />
            <Route path="linha-tempo-visual/:id" element={<ClientLoader Component={TimelineVisualPage} />} />
            <Route path="documentos/:id" element={<ClientLoader Component={ClientDocumentsManager} />} />

            {/* Geração de Docs */}
            <Route path="editor/:id" element={<ClientLoader Component={DocumentsPage} />} />
            <Route path="procuracao/:id" element={<ClientLoader Component={ProcuracaoPrint} />} />

            {/* Admin */}
            <Route path="biblioteca" element={<LibraryPage onBack={() => window.history.back()} />} />
            <Route path="advogados" element={<LawyersPage onBack={() => window.history.back()} />} />
          </Route>
        </Route>
        
        {/* Redirecionamento padrão */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      
      <Toaster />
    </>
  );
}

export default App;