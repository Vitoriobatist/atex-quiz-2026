const jwt = require('jsonwebtoken');

function authMiddleware(req, res, next) {
  const header = req.headers['authorization'];
  if (!header) return res.status(401).json({ erro: 'Token não fornecido.' });

  const token = header.replace('Bearer ', '');
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ erro: 'Token inválido ou expirado.' });
  }
}

function professorOnly(req, res, next) {
  if (req.user?.tipo !== 'professor') {
    return res.status(403).json({ erro: 'Acesso restrito ao professor.' });
  }
  next();
}

module.exports = { authMiddleware, professorOnly };
