const express = require('express');
const db = require('../db');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

router.get('/', authMiddleware, async (req, res) => {
  const alunoId = req.user.id;

  try {
    const [materias] = await db.query(
      `SELECT m.id, m.nome, m.descricao
       FROM materias m
       JOIN aluno_materias am ON am.materia_id = m.id
       WHERE am.aluno_id = ?
       ORDER BY m.nome`,
      [alunoId]
    );

    const [tentativas] = await db.query(
      `SELECT t.id, t.materia_id, m.nome AS materia, t.tema,
              t.acertos, t.total_questoes, t.data_registro AS data_tentativa,
              t.expires_at, t.nivel, t.nivel_rotulo
       FROM tentativas t
       LEFT JOIN materias m ON t.materia_id = m.id
       WHERE t.aluno_id = ?
       ORDER BY t.data_registro ASC`,
      [alunoId]
    );

    const now = new Date();

    const historico = tentativas.map(t => {
      const total = parseInt(t.total_questoes || 0);
      const acertos = parseInt(t.acertos || 0);
      const erros = Math.max(0, total - acertos);
      const percentual = total > 0 ? parseFloat(((acertos / total) * 100).toFixed(1)) : 0;

      const dataFormatada = t.data_tentativa
        ? new Date(t.data_tentativa).toLocaleString('pt-BR', {
            day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit',
          })
        : '';

      const expiresAt = t.expires_at ? new Date(t.expires_at) : null;
      const valido = !expiresAt || expiresAt >= now;
      const expiresFmt = expiresAt
        ? expiresAt.toLocaleString('pt-BR', {
            day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit',
          })
        : null;

      const dificuldade = t.nivel_rotulo || (percentual >= 80 ? 'Fácil' : percentual >= 50 ? 'Médio' : 'Difícil');

      return {
        id: t.id,
        materia_id: t.materia_id,
        materia: t.materia || '—',
        tema: t.tema || 'Quiz',
        data: dataFormatada,
        total,
        acertos,
        erros,
        percentual,
        dificuldade,
        nivel: t.nivel,
        nivel_rotulo: t.nivel_rotulo,
        expires_at: expiresFmt,
        valido,
      };
    });

    res.json({ materias, historico });
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: 'Erro ao buscar dashboard.' });
  }
});

module.exports = router;
