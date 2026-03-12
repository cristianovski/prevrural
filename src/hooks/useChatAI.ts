import { useState, useRef, useEffect } from 'react';
import { generateWithFallback } from '../lib/aiService';

export function useChatAI() {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<{ role: string; text: string }[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, isChatOpen]);

  const sendMessage = async (currentContent: string) => {
    if (!chatInput.trim()) return;
    const userMsg = chatInput;
    setChatMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setChatInput('');
    setChatLoading(true);

    try {
      const prompt = `
        EDITOR JURÍDICO. HTML ATUAL: """${currentContent}"""
        SOLICITAÇÃO: "${userMsg}"
        TAREFA: Reescreva aplicando a alteração. Mantenha formatação HTML. Retorne APENAS HTML.
      `;
      const newHtml = await generateWithFallback(prompt);
      const cleanHtml = newHtml.replace(/```html/g, '').replace(/```/g, '');
      setChatMessages(prev => [...prev, { role: 'model', text: 'Feito.' }]);
      return cleanHtml;
    } catch (err) {
      setChatMessages(prev => [...prev, { role: 'model', text: 'Erro ao ajustar.' }]);
      return null;
    } finally {
      setChatLoading(false);
    }
  };

  return {
    isChatOpen,
    setIsChatOpen,
    chatMessages,
    chatInput,
    setChatInput,
    chatLoading,
    chatEndRef,
    sendMessage,
  };
}