const WebSocket = require('ws');

module.exports = function (wss) {
    wss.on('connection', (ws, req) => {
        console.log('[TBrain] Client connected to proxy WebSocket');
        
        const urlParams = new URLSearchParams(req.url.split('?')[1]);
        const apiKey = urlParams.get('key');

        if (!apiKey) {
            console.error('[TBrain] No Gemini API key provided by client.');
            ws.send(JSON.stringify({ type: 'error', message: 'API Key is missing.' }));
            ws.close();
            return;
        }

        const GEMINI_WS_URL = `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContent?key=${apiKey}`;
        
        const geminiWs = new WebSocket(GEMINI_WS_URL);

        geminiWs.on('open', () => {
            console.log('[TBrain] Connected to Google Gemini Realtime API');
            
            // Wait for context from client before sending setup
            ws.once('message', (contextMsg) => {
                let contextData = {};
                try {
                    const parsed = JSON.parse(typeof contextMsg === 'string' ? contextMsg : contextMsg.toString('utf8'));
                    if (parsed.type === 'context') {
                        contextData = parsed.data || {};
                    }
                } catch(e) {}

                const financeSummary = contextData.finance ? `Renda Mensal: R$${contextData.finance.monthlyIncome}, Gasto Mensal: R$${contextData.finance.monthlySpent}, Gasto Hoje: R$${contextData.finance.spentToday}, Limite Diário: R$${contextData.finance.dailyLimit}. Custos Fixos: ${(contextData.finance.fixedCosts || []).map(c => `${c.name} R$${c.installmentAmount}/mês`).join(', ') || 'nenhum'}` : 'Sem dados financeiros.';
                const habitsSummary = contextData.habits ? contextData.habits.map(h => `[${h.completed ? 'FEITO' : 'PENDENTE'}] ${h.name} (${h.type}, ${h.urgency}) streak:${h.streak}`).join('; ') : 'Sem metas.';
                const vaultSummary = contextData.vault ? `${contextData.vault.length} itens no Cofre. Lembretes pendentes: ${contextData.vault.filter(v => v.type === 'REMINDER' && !v.completed).map(v => v.content).join(', ') || 'nenhum'}` : 'Cofre vazio.';

                const NEURAL_CORE_PROMPT = `Você é o Neural Core do TBrain, o sistema operacional e chefe de gabinete implacável de Eduardo (Engenheiro de Software e perfil financeiro Conservador).

Seu objetivo não é agradar, confortar ou ser um assistente passivo. Seu objetivo é garantir a execução implacável das metas, proteger o patrimônio financeiro e expor inconsistências no comportamento do usuário. Atue como um conselheiro 100% honesto e analítico.

DIRETRIZES:
1. CRUZAMENTO DE DADOS OBRIGATÓRIO: Nunca analise uma métrica isolada. Se Eduardo estourou o orçamento financeiro, verifique se ele cumpriu os Hábitos e Metas. Procure correlações.
2. TOLERÂNCIA ZERO COM DESCULPAS: Se uma meta está parada ou um hábito foi quebrado, confronte-o. Mostre o custo de oportunidade.
3. DIRETO AO PONTO: Sem saudações robóticas. Comece direto no diagnóstico. Use frases curtas, tom firme, profissional e contundente.
4. RECOMPENSA E PUNIÇÃO: Se ele não bateu os hábitos de saúde/foco, recomende o bloqueio de gastos não essenciais.
5. SÍNTESE: Termine sempre com uma ÚNICA ação prioritária para as próximas 2 horas.

CONTEXTO FINANCEIRO: ${financeSummary}
METAS E HÁBITOS: ${habitsSummary}
COFRE NEURAL: ${vaultSummary}

USE AS FERRAMENTAS DISPONÍVEIS para registrar gastos, criar metas, salvar no cofre, ou navegar entre telas quando o usuário pedir. Sempre confirme verbalmente após executar. Responda SEMPRE em Português do Brasil usando áudio.`;

                const setupMessage = {
                    setup: {
                        model: "models/gemini-2.0-flash-exp",
                        generationConfig: {
                            responseModalities: ["AUDIO"],
                            speechConfig: {
                                 voiceConfig: { prebuiltVoiceConfig: { voiceName: "Puck" } }
                            }
                        },
                        systemInstruction: {
                            parts: [{ text: NEURAL_CORE_PROMPT }]
                        },
                        tools: [{
                            functionDeclarations: [
                                {
                                    name: "add_transaction",
                                    description: "Registrar uma transação financeira (gasto ou receita)",
                                    parameters: { type: "OBJECT", properties: { amount: { type: "NUMBER", description: "Valor em Reais" }, type: { type: "STRING", enum: ["income", "expense"], description: "Tipo" } }, required: ["amount", "type"] }
                                },
                                {
                                    name: "add_habit",
                                    description: "Criar uma nova meta ou hábito",
                                    parameters: { type: "OBJECT", properties: { name: { type: "STRING", description: "Nome da meta" }, type: { type: "STRING", enum: ["DAILY", "WEEKLY", "MONTHLY"], description: "Frequência" }, urgency: { type: "STRING", enum: ["HIGH", "NORMAL"], description: "Urgência" } }, required: ["name"] }
                                },
                                {
                                    name: "add_vault_item",
                                    description: "Salvar informação no Cofre Neural",
                                    parameters: { type: "OBJECT", properties: { content: { type: "STRING", description: "Conteúdo" }, type: { type: "STRING", enum: ["NOTE", "LINK", "REMINDER"], description: "Tipo" } }, required: ["content", "type"] }
                                },
                                {
                                    name: "navigate",
                                    description: "Navegar para uma tela do aplicativo",
                                    parameters: { type: "OBJECT", properties: { route: { type: "STRING", enum: ["dashboard", "finance", "habits", "vault", "profile"], description: "Tela" } }, required: ["route"] }
                                }
                            ]
                        }]
                    }
                };
                geminiWs.send(JSON.stringify(setupMessage));

                // Now also listen for subsequent messages
                ws.on('message', (message) => {
                    if (geminiWs.readyState === WebSocket.OPEN) {
                        const messageStr = typeof message === 'string' ? message : message.toString('utf8');
                        geminiWs.send(messageStr);
                    }
                });
            });
        });

        // Gemini -> Browser Proxy
        geminiWs.on('message', (data) => {
            if (ws.readyState === WebSocket.OPEN) {
                const messageStr = typeof data === 'string' ? data : data.toString('utf8');
                try {
                    const parsed = JSON.parse(messageStr);
                    
                    // Handle setup complete
                    if (parsed.setupComplete) {
                        ws.send(JSON.stringify({ type: 'setup_complete' }));
                        return;
                    }

                    // Handle tool calls from Gemini
                    if (parsed.toolCall) {
                        console.log('[TBrain] Gemini requested tool call:', JSON.stringify(parsed.toolCall));
                        ws.send(JSON.stringify({ type: 'tool_call', toolCall: parsed.toolCall }));
                        return;
                    }
                    
                    if (parsed.serverContent) {
                        const modelTurn = parsed.serverContent.modelTurn;
                        if (modelTurn) {
                           ws.send(JSON.stringify({ type: 'model_turn', parts: modelTurn.parts }));
                        }
                        if (parsed.serverContent.interrupted) {
                           ws.send(JSON.stringify({ interrupted: true }));
                        }
                    }
                } catch (e) {
                    console.error("[TBrain] Error parsing Gemini message:", e.message);
                }
            }
        });

        geminiWs.on('close', () => {
             console.log('[TBrain] Gemini API Connection Closed');
             if (ws.readyState === WebSocket.OPEN) ws.close();
        });


        ws.on('close', () => {
             console.log('[TBrain] Browser Client Disconnected');
             if (geminiWs.readyState === WebSocket.OPEN) geminiWs.close();
        });
    });
};
