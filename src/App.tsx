import { useEffect, useState } from 'react';
import { Routes, Route, Navigate, useParams } from 'react-router-dom';
import { supabase } from './lib/supabase';
import { Toaster } from './components/ui/toaster';
import { Layout } from './components/Layout';
import { LoginPage } from './components/LoginPage';
import { ProtectedRoute } from './components/ProtectedRoute';
import { DashboardPage } from './pages/DashboardPage';
import { ClientListPage } from './pages/clients/ClientListPage';
import { ClientFormPage } from './pages/clients/ClientFormPage';
import { AnalysisPage } from './pages/analysis/AnalysisPage';
import { LegalOpinionPage } from './pages/clients/LegalOpinionPage';
import { MasterReportPage } from './pages/analysis/MasterReportPage';
import { TimelinePage } from './pages/timeline/TimelinePage';
import { ClientDocumentsManager } from './pages/documents/ClientDocumentsManager';
import { ProcuracaoPrint } from './pages/documents/ProcuracaoPrint';
import { DocumentsPage } from './pages/documents/DocumentsPage';
import { LibraryPage } from './pages/admin/LibraryPage';
import { LawyersPage } from './pages/admin/LawyersPage';
import { ClientFinancePage } from './pages/finance/ClientFinancePage';
import { CashFlowPage } from './pages/finance/CashFlowPage';
import { Client, ClientComponent, WithClientProps } from './types';

// Wrapper de carregamento de cliente com tipagem
function ClientLoader({ Component }: { Component: ClientComponent }) {
  const { id } = useParams();
  const [client, setClient] = useState<Client | null>(null);
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
      if (data) setClient(data as Client);
      if (error) console.error("Erro ao carregar cliente:", error);
      setLoading(false);
    };
    fetchClient();
  }, [id]);

  if (loading) return <div className="h-full flex items-center justify-center text-slate-400">Carregando contexto do cliente...</div>;
  if (!client && id) return <div className="p-8 text-center">Cliente não encontrado.</div>;
  if (!client) return null; // Segurança

  return <Component cliente={client} onBack={() => window.history.back()} />;
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
            
            {/* Rota para novo cliente (não usa loader) */}
            <Route path="cliente/novo" element={<ClientFormPage onBack={() => window.history.back()} />} />
            
            {/* Rotas que carregam cliente existente */}
            <Route path="cliente/:id" element={<ClientLoader Component={ClientFormPage} />} />
            <Route path="analise/:id" element={<ClientLoader Component={AnalysisPage} />} />
            <Route path="parecer/:id" element={<ClientLoader Component={LegalOpinionPage} />} />
            <Route path="dossie/:id" element={<ClientLoader Component={MasterReportPage} />} />
            <Route path="linha-tempo/:id" element={<ClientLoader Component={TimelinePage} />} />
            <Route path="documentos/:id" element={<ClientLoader Component={ClientDocumentsManager} />} />
            <Route path="editor/:id" element={<ClientLoader Component={DocumentsPage} />} />
            <Route path="procuracao/:id" element={<ClientLoader Component={ProcuracaoPrint} />} />
            <Route path="cliente/:id/financeiro" element={<ClientLoader Component={ClientFinancePage} />} />

            {/* Admin e outras rotas sem cliente */}
            <Route path="biblioteca" element={<LibraryPage onBack={() => window.history.back()} />} />
            <Route path="advogados" element={<LawyersPage onBack={() => window.history.back()} />} />
            <Route path="fluxo-caixa" element={<CashFlowPage />} />
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Toaster />
    </>
  );
}

export default App;