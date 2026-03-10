// supabase/functions/analisar-documentos/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const DEEPSEEK_API_KEY = Deno.env.get("DEEPSEEK_API_KEY")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// Função auxiliar para calcular idade
function calcularIdade(dataNasc: string): number {
  if (!dataNasc) return 0;
  const hoje = new Date();
  const nasc = new Date(dataNasc);
  let idade = hoje.getFullYear() - nasc.getFullYear();
  const m = hoje.getMonth() - nasc.getMonth();
  if (m < 0 || (m === 0 && hoje.getDate() < nasc.getDate())) idade--;
  return idade;
}

serve(async (req) => {
  // CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", { 
      headers: { 
        "Access-Control-Allow-Origin": "*", 
        "Access-Control-Allow-Methods": "POST", 
        "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type" 
      } 
    });
  }

  try {
    console.log("📥 Recebendo requisição...");
    const { clientId, thesisId, documentIds } = await req.json();
    console.log(`📌 clientId: ${clientId}, thesisId: ${thesisId}, documentIds: ${documentIds?.length || 0}`);

    if (!clientId || !thesisId) {
      return new Response(JSON.stringify({ error: "clientId e thesisId são obrigatórios" }), { 
        status: 400, 
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } 
      });
    }

    // Buscar dados do cliente
    console.log("🔍 Buscando cliente...");
    const { data: client, error: clientError } = await supabase
      .from("clients")
      .select("*")
      .eq("id", clientId)
      .single();
    if (clientError || !client) {
      console.error("❌ Cliente não encontrado:", clientError);
      return new Response(JSON.stringify({ error: "Cliente não encontrado" }), { 
        status: 404, 
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } 
      });
    }
    console.log("✅ Cliente encontrado:", client.nome);

    // Buscar tese
    console.log("🔍 Buscando tese...");
    const { data: thesis, error: thesisError } = await supabase
      .from("library_theses")
      .select("*")
      .eq("id", thesisId)
      .single();
    if (thesisError || !thesis) {
      console.error("❌ Tese não encontrada:", thesisError);
      return new Response(JSON.stringify({ error: "Tese não encontrada" }), { 
        status: 404, 
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } 
      });
    }
    console.log("✅ Tese encontrada:", thesis.title);

    // Buscar documentos
    let docs: any[] = [];
    let failedDocs: string[] = [];
    if (documentIds && documentIds.length > 0) {
      console.log("🔍 Buscando documentos...");
      const { data: docsData, error: docsError } = await supabase
        .from("client_documents")
        .select("id, file_url, title")
        .in("id", documentIds);
      if (docsError) {
        console.error("Erro ao buscar documentos:", docsError);
      } else {
        docs = docsData || [];
        console.log(`📄 ${docs.length} documentos encontrados`);
      }
    }

    // Extrair texto de cada documento (com cache)
    let extractedText = "";
    for (const doc of docs) {
      console.log(`📄 Processando documento: ${doc.title}`);
      try {
        // Verificar se já temos OCR no cache
        const { data: cache } = await supabase
          .from("document_ocr_cache")
          .select("extracted_text")
          .eq("document_id", doc.id)
          .maybeSingle(); // usar maybeSingle em vez de single para evitar erro se não existir

        if (cache) {
          console.log(`✅ Cache encontrado para ${doc.title}`);
          extractedText += `\n--- Documento: ${doc.title} ---\n${cache.extracted_text}\n`;
          continue;
        }

        // Baixar arquivo do storage
        console.log(`⬇️ Baixando arquivo: ${doc.file_url}`);
        const filePath = doc.file_url.replace(/.*\/storage\/v1\/object\/public\/evidence-files\//, "");
        const { data: fileData, error: fileError } = await supabase.storage
          .from("evidence-files")
          .download(filePath);
        if (fileError || !fileData) {
          console.error(`❌ Erro ao baixar arquivo: ${fileError?.message || "arquivo não encontrado"}`);
          failedDocs.push(doc.title);
          continue;
        }

        // Converter para base64
        const buffer = await fileData.arrayBuffer();
        const base64 = btoa(String.fromCharCode(...new Uint8Array(buffer)));

        // Chamar DeepSeek-VL para extrair texto
        console.log(`🔍 Enviando para DeepSeek-VL: ${doc.title}`);
        const ocrResponse = await fetch("https://api.deepseek.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${DEEPSEEK_API_KEY}`
          },
          body: JSON.stringify({
            model: "deepseek-vl",
            messages: [
              {
                role: "user",
                content: [
                  { type: "text", text: "Extraia todo o texto contido neste documento de forma literal e organizada, preservando datas, nomes e números." },
                  { type: "image_url", image_url: { url: `data:${fileData.type};base64,${base64}` } }
                ]
              }
            ],
            max_tokens: 4000
          })
        });

        if (!ocrResponse.ok) {
          console.error(`❌ Erro na DeepSeek-VL: ${ocrResponse.status}`);
          failedDocs.push(doc.title);
          continue;
        }

        const ocrData = await ocrResponse.json();
        const text = ocrData.choices[0]?.message?.content || "";
        console.log(`✅ Texto extraído (${text.length} caracteres)`);

        // Salvar no cache
        await supabase.from("document_ocr_cache").insert({
          document_id: doc.id,
          extracted_text: text
        });

        extractedText += `\n--- Documento: ${doc.title} ---\n${text}\n`;

      } catch (docError: any) {
        console.error(`❌ Erro ao processar documento ${doc.title}:`, docError.message);
        failedDocs.push(doc.title);
      }
    }

    // Determinar tipo de benefício para ajustar prompt
    const benefitType = client.beneficio_alvo || "aposentadoria rural";
    let promptTemplate = "";
    if (benefitType.includes("aposentadoria rural")) {
      promptTemplate = "Analise a viabilidade de aposentadoria por idade rural.";
    } else if (benefitType.includes("pensão")) {
      promptTemplate = "Analise a viabilidade de pensão por morte rural.";
    } else {
      promptTemplate = "Analise a viabilidade do benefício previdenciário rural.";
    }

    // Montar prompt final
    const idade = calcularIdade(client.data_nascimento);
    const fullPrompt = `
      ATUE COMO ESPECIALISTA EM DIREITO PREVIDENCIÁRIO RURAL.

      TESE JURÍDICA:
      ${thesis.content}

      DADOS DO CLIENTE:
      Nome: ${client.nome}
      Idade: ${idade}
      Sexo: ${client.sexo || "Não informado"}
      Profissão: ${client.profissao || "Não informada"}
      Possui CNPJ: ${client.possui_cnpj ? "Sim" : "Não"}
      Possui outra renda: ${client.possui_outra_renda ? "Sim" : "Não"}

      FATOS EXTRAÍDOS DOS DOCUMENTOS:
      ${extractedText || "Nenhum documento fornecido."}

      INSTRUÇÃO:
      ${promptTemplate}
      Com base na tese e nos fatos, emita um parecer estruturado em markdown com os seguintes tópicos:
      ## 🚦 VEREDITO: (VIÁVEL / RISCO MÉDIO / INVIÁVEL)
      ### 🔎 PONTOS DE ATENÇÃO
      ### ✅ PONTOS FORTES
      ### 📝 PLANO DE AÇÃO
    `;

    // Chamar DeepSeek-Chat
    console.log("🤖 Enviando para DeepSeek-Chat...");
    const chatResponse = await fetch("https://api.deepseek.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${DEEPSEEK_API_KEY}`
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [{ role: "user", content: fullPrompt }],
        temperature: 0.7,
        max_tokens: 2000
      })
    });

    if (!chatResponse.ok) {
      const errorText = await chatResponse.text();
      console.error("❌ Erro na DeepSeek-Chat:", chatResponse.status, errorText);
      throw new Error(`Erro na DeepSeek: ${chatResponse.status} - ${errorText}`);
    }

    const chatData = await chatResponse.json();
    const parecer = chatData.choices[0]?.message?.content || "";
    console.log("✅ Parecer gerado com sucesso");

    // Salvar parecer no cliente
    console.log("💾 Salvando parecer no cliente...");
    await supabase
      .from("clients")
      .update({
        parecer_ia: parecer,
        data_ultima_analise: new Date().toISOString()
      })
      .eq("id", clientId);

    console.log("✅ Processo concluído com sucesso");
    return new Response(
      JSON.stringify({ success: true, parecer, failedDocs }),
      { 
        headers: { 
          "Content-Type": "application/json", 
          "Access-Control-Allow-Origin": "*" 
        } 
      }
    );

  } catch (error: any) {
    console.error("❌ Erro geral:", error.message);
    console.error("Stack:", error.stack);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { 
          "Content-Type": "application/json", 
          "Access-Control-Allow-Origin": "*" 
        } 
      }
    );
  }
});