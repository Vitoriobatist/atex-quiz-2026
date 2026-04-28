const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const db = require('../db');
const { authMiddleware, professorOnly } = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware, professorOnly);

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

function uploadPara(pastaSlug) {
  const dest = path.join(__dirname, '../../uploads', pastaSlug);
  if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
  return multer({ dest });
}

// ======= MÉTRICAS =======
router.get('/metricas', async (req, res) => {
  try {
    const [[{ total: totalDisciplinas }]] = await db.query('SELECT COUNT(*) AS total FROM materias');
    const [[{ total: totalAlunos }]] = await db.query(
      "SELECT COUNT(*) AS total FROM alunos WHERE email <> 'pedro.professor@gmail.com'"
    );
    const [[{ total: totalVinculos }]] = await db.query('SELECT COUNT(*) AS total FROM aluno_materias');
    const [ultimas] = await db.query(
      'SELECT id, nome, descricao FROM materias ORDER BY id DESC LIMIT 5'
    );
    res.json({ totalDisciplinas, totalAlunos, totalVinculos, ultimas });
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: 'Erro ao buscar métricas.' });
  }
});

// ======= ALUNOS =======
router.get('/alunos', async (req, res) => {
  try {
    const [alunos] = await db.query(
      "SELECT id, nome, email FROM alunos WHERE email <> 'pedro.professor@gmail.com' ORDER BY nome"
    );
    res.json({ alunos });
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao buscar alunos.' });
  }
});

router.delete('/alunos/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  try {
    await db.query('DELETE FROM alunos WHERE id = ?', [id]);
    res.json({ sucesso: true, mensagem: 'Aluno excluído com sucesso.' });
  } catch (err) {
    res.status(500).json({ sucesso: false, mensagem: 'Erro ao excluir aluno.' });
  }
});

// ======= VÍNCULOS =======
router.get('/vinculos', async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT a.id AS aluno_id, a.nome AS aluno_nome, a.email,
              m.id AS materia_id, m.nome AS materia_nome
       FROM aluno_materias am
       JOIN alunos a ON a.id = am.aluno_id
       JOIN materias m ON m.id = am.materia_id
       ORDER BY a.nome, m.nome`
    );

    const porAluno = {};
    rows.forEach(r => {
      if (!porAluno[r.aluno_id]) {
        porAluno[r.aluno_id] = { nome: r.aluno_nome, email: r.email, materias: [] };
      }
      porAluno[r.aluno_id].materias.push({ id: r.materia_id, nome: r.materia_nome });
    });

    res.json({ vinculos: porAluno });
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao buscar vínculos.' });
  }
});

// ======= DISCIPLINAS =======
router.get('/disciplinas', async (req, res) => {
  try {
    const [disciplinas] = await db.query(
      'SELECT id, nome, descricao, periodo FROM materias ORDER BY nome ASC'
    );
    res.json({ disciplinas });
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao buscar disciplinas.' });
  }
});

router.post('/disciplinas', async (req, res) => {
  const { nome, descricao, periodo } = req.body;
  if (!nome) return res.status(400).json({ sucesso: false, mensagem: 'Nome é obrigatório.' });
  const per = parseInt(periodo) || null;
  try {
    const [result] = await db.query(
      'INSERT INTO materias (nome, descricao, periodo) VALUES (?, ?, ?)',
      [nome.trim(), descricao?.trim() || '', per]
    );
    res.json({ sucesso: true, mensagem: 'Disciplina cadastrada!', id: result.insertId });
  } catch (err) {
    res.status(500).json({ sucesso: false, mensagem: 'Erro ao cadastrar disciplina.' });
  }
});

router.delete('/disciplinas/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  try {
    await db.query('DELETE FROM materias WHERE id = ?', [id]);
    res.json({ sucesso: true, mensagem: 'Disciplina excluída.' });
  } catch (err) {
    res.status(500).json({ sucesso: false, mensagem: 'Erro ao excluir disciplina.' });
  }
});

router.get('/disciplinas/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  try {
    const [[disc]] = await db.query('SELECT * FROM materias WHERE id = ? LIMIT 1', [id]);
    if (!disc) return res.status(404).json({ erro: 'Disciplina não encontrada.' });

    // alunos vinculados
    const [alunos] = await db.query(
      `SELECT a.id, a.nome, a.email FROM alunos a
       JOIN aluno_materias am ON am.aluno_id = a.id
       WHERE am.materia_id = ? ORDER BY a.nome`,
      [id]
    );

    // todos os alunos (para associar)
    const [todosAlunos] = await db.query(
      "SELECT id, nome, email FROM alunos WHERE email <> 'pedro.professor@gmail.com' ORDER BY nome"
    );

    // arquivos da pasta
    const slug = slugDisciplina(disc.nome);
    const pasta = path.join(__dirname, '../../uploads', slug);
    let arquivos = [];
    if (fs.existsSync(pasta)) {
      arquivos = fs.readdirSync(pasta).filter(f =>
        fs.statSync(path.join(pasta, f)).isFile()
      );
    }

    res.json({ disciplina: disc, alunos, todosAlunos, arquivos, slug });
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: 'Erro ao buscar disciplina.' });
  }
});

// Upload de arquivo para a disciplina
router.post('/disciplinas/:id/upload', async (req, res) => {
  const id = parseInt(req.params.id);
  try {
    const [[disc]] = await db.query('SELECT nome FROM materias WHERE id = ? LIMIT 1', [id]);
    if (!disc) return res.status(404).json({ erro: 'Disciplina não encontrada.' });

    const slug = slugDisciplina(disc.nome);
    const dest = path.join(__dirname, '../../uploads', slug);
    if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });

    const upload = multer({ dest }).single('arquivo');
    upload(req, res, err => {
      if (err) return res.status(400).json({ erro: 'Erro no upload.' });
      if (!req.file) return res.status(400).json({ erro: 'Nenhum arquivo enviado.' });

      const originalName = req.file.originalname;
      const destPath = path.join(dest, originalName);
      fs.renameSync(req.file.path, destPath);

      res.json({ sucesso: true, arquivo: originalName });
    });
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao fazer upload.' });
  }
});

// Excluir arquivo da disciplina
router.delete('/disciplinas/:id/arquivo', async (req, res) => {
  const id = parseInt(req.params.id);
  const { nome } = req.body;
  try {
    const [[disc]] = await db.query('SELECT nome FROM materias WHERE id = ? LIMIT 1', [id]);
    if (!disc) return res.status(404).json({ erro: 'Disciplina não encontrada.' });

    const slug = slugDisciplina(disc.nome);
    const filePath = path.join(__dirname, '../../uploads', slug, path.basename(nome));
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

    res.json({ sucesso: true });
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao excluir arquivo.' });
  }
});

// Salvar associações aluno ↔ disciplina
router.post('/disciplinas/:id/associacoes', async (req, res) => {
  const materiaId = parseInt(req.params.id);
  const { aluno_ids } = req.body; // array de ids

  try {
    await db.query('DELETE FROM aluno_materias WHERE materia_id = ?', [materiaId]);

    if (Array.isArray(aluno_ids) && aluno_ids.length > 0) {
      const values = aluno_ids.map(aid => [parseInt(aid), materiaId]);
      await db.query('INSERT INTO aluno_materias (aluno_id, materia_id) VALUES ?', [values]);
    }

    res.json({ sucesso: true, mensagem: 'Associações salvas.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ sucesso: false, mensagem: 'Erro ao salvar associações.' });
  }
});

module.exports = router;
