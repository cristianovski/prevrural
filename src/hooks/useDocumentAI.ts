import { useState } from 'react';
import { generateWithFallback } from '../lib/aiService';
import { Client } from '../types';
import { OfficeProfile } from './useOfficeProfile';

export function useDocumentAI() {
  const [generating, setGenerating] = useState(false);
  const [documentHtml, setDocumentHtml] = useState('');

  const generateDocument = async (
    cliente: Client,
    officeProfile: OfficeProfile | null,
    template: string
  ) => {
    if (!officeProfile) {
      alert('Por favor, configure os dados do escritório antes de gerar documentos.');
      return false;
    }

    setGenerating(true);
    setDocumentHtml('');

    try {
      const prompt = `
        Aja como um Assistente Jurídico Expert.
        
        CONTEXTO: Você está gerando um documento para um sistema multiusuário.
        Você deve cruzar os dados do CLIENTE com os dados do ADVOGADO/ESCRITÓRIO para preencher o modelo.
        
        1. DADOS DO CLIENTE (CONTRATANTE):
        Nome: ${cliente.nome}
        CPF: ${cliente.cpf}
        Profissão: ${cliente.profissao || "Não informada"}
        Estado Civil: ${cliente.estado_civil || "Não informado"}
        Endereço: ${cliente.endereco || "Endereço não cadastrado"}
        RG: ${cliente.rg || "Não informado"}
        
        2. DADOS DO ESCRITÓRIO/ADVOGADO (CONTRATADA):
        Nome do Advogado(s): ${officeProfile.nome_advogado}
        OAB: ${officeProfile.oab}
        Endereço Profissional: ${officeProfile.endereco_profissional}
        Cidade/UF: ${officeProfile.cidade_uf}
        
        3. MODELO BRUTO:
        """
        ${template}
        """
        
        TAREFA: 
        Substitua TODOS os placeholders do modelo pelos dados reais acima.
        Formate o resultado em HTML SIMPLES (usando <b> para negrito em nomes/dados).
        Justifique o texto. Centralize títulos.
        
        Retorne APENAS o HTML do conteúdo.
      `;

      const filledHtml = await generateWithFallback(prompt);
      let cleanHtml = filledHtml.replace(/```html/g, '').replace(/```/g, '').trim();
      if (!cleanHtml.includes('<p>')) {
        cleanHtml = cleanHtml.split('\n').map(line => line.trim() ? `<p>${line}</p>` : '').join('');
      }
      setDocumentHtml(cleanHtml);
      return true;
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Erro na geração do documento.';
      alert(msg);
      return false;
    } finally {
      setGenerating(false);
    }
  };

  return {
    generating,
    documentHtml,
    setDocumentHtml,
    generateDocument,
  };
}