const express = require('express');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const pdfParse = require('pdf-parse');
const db = require('../db');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// ------- helpers -------
function slugDisciplina(nome) {
  return nome
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '');
}

function limpaConteudo(texto, limite = 12000) {
  texto = texto.replace(/[^\x20-\x7E\n\r\tÀ-ɏ]/g, ' ');
  texto = texto.replace(/\s+/g, ' ').trim();
  return texto.slice(0, limite);
}

async function extraiTextoArquivo(caminho, limite = 12000) {
  const ext = path.extname(caminho).toLowerCase();
  let texto = '';
  if (ext === '.pdf') {
    try {
      const buffer = fs.readFileSync(caminho);
      const resultado = await pdfParse(buffer);
      texto = resultado.text || '';
    } catch (err) {
      console.error(`[pdf-parse] Falha ao extrair "${caminho}":`, err.message);
    }
  }
  if (!texto) {
    try { texto = fs.readFileSync(caminho, 'utf8'); } catch {}
  }
  return limpaConteudo(texto, limite);
}

function rotuloNivel(n) {
  return { fundamental: 'Fundamental', medio: 'Médio', superior: 'Superior' }[n] || 'Médio';
}

// GET /api/quiz/materias — matérias do aluno logado
router.get('/materias', authMiddleware, async (req, res) => {
  try {
    const alunoId = req.user.id;
    const [rows] = await db.query(
      `SELECT m.id, m.nome FROM materias m
       INNER JOIN aluno_materias am ON m.id = am.materia_id
       WHERE am.aluno_id = ? ORDER BY m.nome`,
      [alunoId]
    );

    if (rows.length === 0) {
      const [todas] = await db.query('SELECT id, nome FROM materias ORDER BY nome');
      return res.json({ materias: todas, aviso: 'Nenhuma matéria vinculada. Exibindo todas.' });
    }

    res.json({ materias: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: 'Erro ao buscar matérias.' });
  }
});

// POST /api/quiz/gerar
router.post('/gerar', authMiddleware, async (req, res) => {
  const { materia_id, tema, quantidade } = req.body;
  const qtd = Math.max(1, Math.min(20, parseInt(quantidade) || 5));

  const apiKey = process.env.GROQ_API_KEY || '';
  if (!apiKey) return res.status(500).json({ erro: 'GROQ_API_KEY não configurada.' });

  // busca período da matéria no BD
  let periodoFaculdade = null;
  let materiaRaw = tema || '';
  try {
    if (materia_id) {
      const [r] = await db.query('SELECT nome, periodo FROM materias WHERE id = ? LIMIT 1', [materia_id]);
      if (r[0]) {
        materiaRaw = r[0].nome;
        periodoFaculdade = r[0].periodo ?? null;
      }
    }
  } catch {}

  // tenta carregar PDFs da pasta
  const materiaSlug = slugDisciplina(materiaRaw);
  const pastaMateria = path.join(__dirname, '../../uploads', materiaSlug);
  let conteudoBase = '';

  if (fs.existsSync(pastaMateria)) {
    const arquivos = fs.readdirSync(pastaMateria).filter(f =>
      fs.statSync(path.join(pastaMateria, f)).isFile()
    );
    // usa só os primeiros 4000 chars de cada arquivo — suficiente para contexto
    // sem consumir tokens demais e deixar espaço para a resposta da IA
    const LIMITE_POR_ARQUIVO = 4000;
    const LIMITE_TOTAL = 8000;
    let limiteRestante = LIMITE_TOTAL;
    for (const nomeArq of arquivos) {
      if (limiteRestante <= 0) break;
      const texto = await extraiTextoArquivo(
        path.join(pastaMateria, nomeArq),
        Math.min(LIMITE_POR_ARQUIVO, limiteRestante)
      );
      if (texto) {
        conteudoBase += (conteudoBase ? '\n\n---\n\n' : '') + texto;
        limiteRestante -= texto.length;
      }
    }
  }

  const escolaridade = periodoFaculdade !== null ? 'superior' : 'medio';
  const nivelRotulo = rotuloNivel(escolaridade);

  const infoPeriodo = periodoFaculdade
    ? `\nContexto: disciplina do ${periodoFaculdade}º período da graduação.\n`
    : '';

  let contextoArquivo = '';
  let temaEfetivo = '';

  if (conteudoBase) {
    temaEfetivo = materiaRaw;
    contextoArquivo = `
CONTEXTO DA MATÉRIA (trecho inicial do material didático — use para identificar os temas, conceitos e terminologias abordados):
"""
${conteudoBase}
"""
Com base nos temas e conceitos identificados nesse contexto, gere questões sobre a disciplina "${materiaRaw}".
`;
  } else {
    temaEfetivo = materiaRaw || tema || 'Conhecimentos Gerais';
  }

  const regrasMap = {
    fundamental: 'Nível FUNDAMENTAL: perguntas simples, vocabulário acessível, frases curtas.',
    medio: 'Nível MÉDIO: dificuldade intermediária, exige raciocínio e interpretação.',
    superior: `Nível SUPERIOR (graduação): questões elaboradas com raciocínio analítico.${infoPeriodo}`,
  };

  const prompt = `Gere exatamente ${qtd} questões de múltipla escolha sobre "${temaEfetivo}" no nível "${escolaridade}".
${regrasMap[escolaridade]}
${contextoArquivo}
RESTRIÇÕES:
- Cada questão deve abordar um conceito DIFERENTE.
- Saída: APENAS um array JSON válido, sem markdown.

Formato de cada item:
{
  "pergunta": "texto",
  "alternativas": ["op1","op2","op3","op4"],
  "resposta_correta": 0,
  "resposta_correta_texto": "repita a alternativa correta",
  "justificativa_correta": "por que está certa",
  "justificativas_alternativas": ["explique 0","explique 1","explique 2","explique 3"]
}`;

  try {
    const maxTokens = Math.min(8000, 450 * qtd + 600);
    const { data } = await axios.post(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: 'Responda APENAS com JSON válido, sem markdown, sem comentários.' },
          { role: 'user', content: prompt },
        ],
        temperature: 0.2,
        max_tokens: maxTokens,
      },
      {
        headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        timeout: 50000,
      }
    );

    let raw = (data.choices?.[0]?.message?.content || '').trim();
    raw = raw.replace(/^```(?:json)?\s*|\s*```$/gm, '');

    // tenta corrigir JSON truncado fechando o array no último objeto completo
    let questoes;
    try {
      questoes = JSON.parse(raw);
    } catch {
      const ultimoFechamento = raw.lastIndexOf('}');
      if (ultimoFechamento !== -1) {
        const recuperado = raw.slice(0, ultimoFechamento + 1) + ']';
        questoes = JSON.parse(recuperado);
      } else {
        throw new Error('JSON inválido na resposta da IA.');
      }
    }
    if (!Array.isArray(questoes)) throw new Error('Resposta não é array');

    // normaliza índices
    questoes = questoes.slice(0, qtd).map((q, i) => {
      const alts = (q.alternativas || []).slice(0, 4);
      while (alts.length < 4) alts.push(String.fromCharCode(65 + alts.length));

      let idx = parseInt(q.resposta_correta ?? 0);
      if (idx >= 1 && idx <= 4) idx -= 1;

      const corretaTexto = (q.resposta_correta_texto || '').trim();
      if (corretaTexto) {
        const found = alts.findIndex(a => a.trim().toLowerCase() === corretaTexto.toLowerCase());
        if (found >= 0) idx = found;
      }

      return {
        ...q,
        pergunta: q.pergunta || `Pergunta ${i + 1}`,
        alternativas: alts,
        resposta_correta: Math.max(0, Math.min(3, idx)),
      };
    });

    while (questoes.length < qtd) {
      const i = questoes.length;
      questoes.push({
        pergunta: `Pergunta ${i + 1}`,
        alternativas: ['A', 'B', 'C', 'D'],
        resposta_correta: 0,
        resposta_correta_texto: 'A',
        justificativa_correta: '',
        justificativas_alternativas: ['', '', '', ''],
      });
    }

    res.json({ questoes, tema: materiaRaw, nivel: escolaridade, nivelRotulo, materia_id: materia_id || null });
  } catch (err) {
    console.error('Erro ao gerar:', err.message);
    res.status(500).json({ erro: 'Falha ao gerar questões: ' + err.message });
  }
});

// POST /api/quiz/resultado
router.post('/resultado', authMiddleware, async (req, res) => {
  const { questoes, respostas, tema, materia_id, nivel, nivelRotulo } = req.body;
  const alunoId = req.user.id;

  if (!Array.isArray(questoes) || !Array.isArray(respostas)) {
    return res.status(400).json({ erro: 'Dados inválidos.' });
  }

  const total = questoes.length;
  let acertos = 0;
  questoes.forEach((q, i) => {
    if (respostas[i] !== null && respostas[i] !== undefined && parseInt(respostas[i]) === parseInt(q.resposta_correta)) {
      acertos++;
    }
  });

  const erros = total - acertos;
  const percentual = total > 0 ? parseFloat(((acertos / total) * 100).toFixed(1)) : 0;

  try {
    const materiaParam = materia_id ? parseInt(materia_id) : null;

    const [result] = await db.query(
      `INSERT INTO tentativas (aluno_id, materia_id, tema, acertos, total_questoes, data_registro, expires_at, nivel, nivel_rotulo)
       VALUES (?, ?, ?, ?, ?, NOW(), DATE_ADD(NOW(), INTERVAL 7 DAY), ?, ?)`,
      [alunoId, materiaParam, tema || 'Quiz', acertos, total, nivel || 'medio', nivelRotulo || 'Médio']
    );

    const tentativaId = result.insertId;

    for (let i = 0; i < questoes.length; i++) {
      const q = questoes[i];
      await db.query(
        `INSERT INTO questoes (tentativa_id, pergunta, alternativas, correta, selecionada, justificativa_correta, justificativas_alternativas)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          tentativaId,
          q.pergunta,
          JSON.stringify(q.alternativas),
          q.resposta_correta,
          respostas[i] !== undefined ? parseInt(respostas[i]) : null,
          q.justificativa_correta || null,
          q.justificativas_alternativas ? JSON.stringify(q.justificativas_alternativas) : null,
        ]
      );
    }

    res.json({ sucesso: true, acertos, erros, total, percentual, tentativa_id: tentativaId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: 'Erro ao salvar resultado.' });
  }
});

// GET /api/quiz/revisao/:id
router.get('/revisao/:id', authMiddleware, async (req, res) => {
  const tentativaId = parseInt(req.params.id);
  const alunoId = req.user.id;

  try {
    const [tent] = await db.query(
      `SELECT t.*, m.nome AS materia_nome FROM tentativas t
       LEFT JOIN materias m ON t.materia_id = m.id
       WHERE t.id = ? AND t.aluno_id = ? LIMIT 1`,
      [tentativaId, alunoId]
    );

    if (!tent[0]) return res.status(404).json({ erro: 'Tentativa não encontrada.' });

    const now = new Date();
    const expiresAt = tent[0].expires_at ? new Date(tent[0].expires_at) : null;
    if (expiresAt && expiresAt < now) {
      return res.status(403).json({ erro: 'Esta revisão expirou.' });
    }

    const [questoes] = await db.query(
      'SELECT * FROM questoes WHERE tentativa_id = ? ORDER BY id',
      [tentativaId]
    );

    const questoesFormatadas = questoes.map(q => ({
      ...q,
      alternativas: JSON.parse(q.alternativas || '[]'),
      justificativas_alternativas: q.justificativas_alternativas
        ? JSON.parse(q.justificativas_alternativas)
        : [],
    }));

    res.json({ tentativa: tent[0], questoes: questoesFormatadas });
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: 'Erro ao buscar revisão.' });
  }
});

module.exports = router;
