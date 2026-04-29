const express = require('express');
const axios = require('axios');
const { authMiddleware } = require('../middleware/auth');
const pool = require('../db');

const router = express.Router();

function buildRevisaoPrompt(contexto) {
  const questoesStr = (contexto.questoes || []).map(q => {
    const alts = (q.alternativas || [])
      .map((a, j) => `  ${String.fromCharCode(65 + j)}) ${a}`)
      .join('\n');
    const corretaLetra = String.fromCharCode(65 + (q.correta ?? 0));
    const corretaTexto = q.alternativas?.[q.correta] || '';
    const selecionadaLetra = q.selecionada !== null && q.selecionada !== undefined
      ? String.fromCharCode(65 + q.selecionada)
      : null;
    const selecionadaTexto = selecionadaLetra ? (q.alternativas?.[q.selecionada] || '') : '';
    const status = q.acertou ? '✓ Acertou' : '✗ Errou';

    return `Questão ${q.numero} [${status}]:
${q.pergunta}
${alts}
  Resposta correta: ${corretaLetra}) ${corretaTexto}
  Resposta do aluno: ${selecionadaLetra ? `${selecionadaLetra}) ${selecionadaTexto}` : 'Não respondida'}`;
  }).join('\n\n');

  const focoStr = contexto.questaoFoco
    ? `\nO aluno está perguntando especificamente sobre a Questão ${contexto.questaoFoco}.`
    : '';

  return `Você é um tutor acadêmico do sistema Quiz Simpat.IA.
O aluno fez um quiz e quer entender as questões que errou. Abaixo estão todas as questões com os resultados:

${questoesStr}
${focoStr}

Quando o aluno perguntar sobre uma questão (pelo número ou conteúdo):
1. Identifique a questão correta pelo número ou pelo assunto.
2. Explique por que a alternativa escolhida pelo aluno está incorreta.
3. Explique por que a resposta correta está certa.
Use linguagem clara, didática e encorajadora. Responda em português.`;
}

async function salvarLog(userId, tipo, pergunta, resposta, latenciaMs) {
  try {
    await pool.execute(
      'INSERT INTO chat_logs (user_id, tipo, pergunta, resposta, latencia_ms) VALUES (?, ?, ?, ?, ?)',
      [userId, tipo, pergunta, resposta.slice(0, 5000), latenciaMs]
    );
  } catch (err) {
    console.error('[chat_logs] Falha ao salvar log:', err.message);
  }
}

router.post('/', authMiddleware, async (req, res) => {
  const { pergunta, tipo, contexto } = req.body;
  const apiKey = process.env.GROQ_API_KEY || '';

  if (!pergunta?.trim()) return res.status(400).json({ erro: 'Pergunta vazia.' });
  if (!apiKey) return res.status(500).json({ erro: 'GROQ_API_KEY não configurada.' });

  const ehProfessor = tipo === 'professor' || req.user?.tipo === 'professor';

  let systemMsg;

  if (tipo === 'revisao' && contexto?.questoes) {
    systemMsg = buildRevisaoPrompt(contexto);
  } else if (ehProfessor) {
    systemMsg = `Você é um assistente para professores no sistema Quiz Simpat.IA.
Ajude o professor a usar o sistema: cadastrar disciplinas, organizar conteúdos, entender desempenho dos alunos.
NÃO responda perguntas de conteúdo acadêmico. Se perguntarem, diga: 'Eu ajudo apenas com o uso do sistema 😊'
Seja claro, direto e profissional.`;
  } else {
    systemMsg = `Você é um assistente do sistema Quiz Simpat.IA.
Ajude o aluno a usar o sistema: como funciona o gerador de questões, níveis, dicas de estudo.
NÃO responda perguntas de conteúdo acadêmico. Se perguntarem, diga: 'Eu ajudo apenas com dúvidas sobre como usar o sistema 😊'
Seja claro, direto e didático.`;
  }

  const tipoLog = tipo === 'revisao' ? 'revisao' : ehProfessor ? 'professor' : 'aluno';
  const inicio = Date.now();

  try {
    const { data } = await axios.post(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: systemMsg },
          { role: 'user', content: pergunta },
        ],
        temperature: 0.7,
        max_tokens: 600,
      },
      {
        headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        timeout: 30000,
      }
    );

    const resposta = data.choices?.[0]?.message?.content || 'Sem resposta.';
    const latencia = Date.now() - inicio;

    await salvarLog(req.user.id, tipoLog, pergunta.trim(), resposta, latencia);

    res.json({ resposta });
  } catch (err) {
    const latencia = Date.now() - inicio;
    const mensagemErro = err.response?.data?.error?.message || err.message || 'Erro desconhecido';

    console.error(`[chat] Erro na requisição Groq (${latencia}ms):`, mensagemErro);
    await salvarLog(req.user.id, tipoLog, pergunta.trim(), `[ERRO] ${mensagemErro}`, latencia);

    if (err.code === 'ECONNABORTED' || err.message?.includes('timeout')) {
      return res.status(504).json({ erro: 'O assistente demorou para responder. Tente novamente.' });
    }

    res.status(500).json({ erro: 'Erro ao consultar IA. Tente novamente em instantes.' });
  }
});

module.exports = router;
