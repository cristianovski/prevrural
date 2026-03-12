import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export interface OfficeProfile {
  id?: number;
  nome_advogado?: string;
  oab?: string;
  endereco_profissional?: string;
  cidade_uf?: string;
}

export function useOfficeProfile() {
  const [officeProfile, setOfficeProfile] = useState<OfficeProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [configForm, setConfigForm] = useState({ nome: '', oab: '', endereco: '', cidade: '' });

  useEffect(() => {
    loadOfficeProfile();
  }, []);

  const loadOfficeProfile = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('office_profile')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (data) {
        setOfficeProfile(data);
        setConfigForm({
          nome: data.nome_advogado || '',
          oab: data.oab || '',
          endereco: data.endereco_profissional || '',
          cidade: data.cidade_uf || '',
        });
      } else {
        // Se não houver perfil, abre o modal de configuração
        setIsConfigOpen(true);
      }
    } catch (error) {
      console.error('Erro ao carregar perfil do escritório:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveOfficeProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const payload = {
        user_id: user.id,
        nome_advogado: configForm.nome,
        oab: configForm.oab,
        endereco_profissional: configForm.endereco,
        cidade_uf: configForm.cidade,
      };

      let result;
      if (officeProfile?.id) {
        result = await supabase.from('office_profile').update(payload).eq('id', officeProfile.id);
      } else {
        result = await supabase.from('office_profile').insert(payload);
      }

      if (result.error) throw result.error;

      await loadOfficeProfile();
      setIsConfigOpen(false);
      alert('Dados do escritório salvos!');
    } catch (error) {
      console.error('Erro ao salvar perfil:', error);
      alert('Erro ao salvar. Tente novamente.');
    }
  };

  return {
    officeProfile,
    loading,
    isConfigOpen,
    setIsConfigOpen,
    configForm,
    setConfigForm,
    saveOfficeProfile,
  };
}