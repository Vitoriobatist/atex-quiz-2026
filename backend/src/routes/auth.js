const express = require('express');
const jwt = require('jsonwebtoken');
const db = require('../db');

const router = express.Router();

const PROFESSOR_EMAIL = 'pedro.professor@gmail.com';

router.post('/login', async (req, res) => {
  const { email, senha } = req.body;
  if (!email || !senha) {
    return res.status(400).json({ erro: 'E-mail e senha são obrigatórios.' });
  }

  try {
    const [rows] = await db.query(
      'SELECT id, nome, email, senha_hash FROM alunos WHERE email = ? LIMIT 1',
      [email.trim()]
    );

    const usuario = rows[0];
    if (!usuario || senha !== usuario.senha_hash) {
      return res.status(401).json({ erro: 'E-mail ou senha inválidos.' });
    }

    const tipo = email.trim() === PROFESSOR_EMAIL ? 'professor' : 'aluno';

    const token = jwt.sign(
      { id: usuario.id, nome: usuario.nome, email: usuario.email, tipo },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.json({ token, usuario: { id: usuario.id, nome: usuario.nome, email: usuario.email, tipo } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: 'Erro interno ao fazer login.' });
  }
});

router.post('/cadastro', async (req, res) => {
  const { nome, email, senha, confirmar, periodo } = req.body;

  if (!nome || !email || !senha || !confirmar) {
    return res.status(400).json({ sucesso: false, mensagem: 'Preencha todos os campos.' });
  }

  const per = parseInt(periodo);
  if (isNaN(per) || per < 1 || per > 8) {
    return res.status(400).json({ sucesso: false, mensagem: 'Selecione um período válido (1 a 8).' });
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ sucesso: false, mensagem: 'Informe um e-mail válido.' });
  }

  if (senha.length < 8) {
    return res.status(400).json({ sucesso: false, mensagem: 'A senha deve ter pelo menos 8 caracteres.' });
  }

  if (senha !== confirmar) {
    return res.status(400).json({ sucesso: false, mensagem: 'As senhas não coincidem.' });
  }

  try {
    const [existe] = await db.query('SELECT id FROM alunos WHERE email = ? LIMIT 1', [email.trim()]);
    if (existe.length > 0) {
      return res.status(400).json({ sucesso: false, mensagem: 'Este e-mail já está cadastrado.' });
    }

    const [result] = await db.query(
      'INSERT INTO alunos (nome, email, senha_hash, periodo) VALUES (?, ?, ?, ?)',
      [nome.trim(), email.trim(), senha, per]
    );

    const alunoId = result.insertId;

    // vincula com todas as matérias do mesmo período
    await db.query(
      `INSERT INTO aluno_materias (aluno_id, materia_id)
       SELECT ?, m.id FROM materias m WHERE m.periodo = ?`,
      [alunoId, per]
    );

    const token = jwt.sign(
      { id: alunoId, nome: nome.trim(), email: email.trim(), tipo: 'aluno' },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.json({
      sucesso: true,
      mensagem: 'Conta criada com sucesso!',
      token,
      usuario: { id: alunoId, nome: nome.trim(), email: email.trim(), tipo: 'aluno' },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ sucesso: false, mensagem: 'Erro ao cadastrar: ' + err.message });
  }
});

module.exports = router;
