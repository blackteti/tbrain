import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const body = await req.json();
  const { exercise_name, reps, weight, history, userProfile } = body;

  const geminiApiKey = process.env.GEMINI_API_KEY;
  if (!geminiApiKey) {
    return NextResponse.json({ feedback: 'Chave do Gemini não configurada.' });
  }

  const userContext = userProfile 
    ? `Usuário: ${userProfile.age || '?'} anos, ${userProfile.height || '?'} cm, ${userProfile.weight || '?'} kg.` 
    : 'Biotipo do usuário não informado.';

  let historyContext = 'Este é o primeiro registro deste exercício.';
  if (history && history.length > 0) {
      historyContext = 'Histórico recente:\n' + history.map((h: any) => `- ${h.sets}x${h.reps} com ${h.weight}kg`).join('\n');
  }

  const prompt = `
Você é um Personal Trainer AI especialista em biomecânica e hipertrofia.
O usuário está cadastrando um log de treino e você deve dar um feedback curto, encorajador e direto (MÁXIMO 2 FRASES curtas).

Contexto Físico: ${userContext}
Exercício Atual: ${exercise_name}
Configuração Atual: ${reps} repetições com carga de ${weight}kg.

${historyContext}

Responda:
1. Validando o exercício (se é bom para hipertrofia/força).
2. Se a carga/repetições estão num padrão bom, ou se baseando no histórico o usuário deve estagnar, aumentar a carga ou mudar a faixa de repetições.

Seja direto ao ponto e não utilize saudações. Idioma: Português do Brasil.`;

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiApiKey}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
                temperature: 0.3,
                maxOutputTokens: 100
            }
        })
    });

    const data = await response.json();
    const feedback = data.candidates?.[0]?.content?.parts?.[0]?.text || 'Exercício registrado!';

    return NextResponse.json({ feedback });
  } catch (error) {
    console.error('Error in analyze API:', error);
    return NextResponse.json({ feedback: 'Seu log foi registrado (IA Indisponível).' });
  }
}
