require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const authRoutes      = require('./routes/auth');
const quizRoutes      = require('./routes/quiz');
const dashboardRoutes = require('./routes/dashboard');
const professorRoutes = require('./routes/professor');
const chatRoutes      = require('./routes/chat');

const app = express();

app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// serve arquivos de upload (PDFs das disciplinas)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.use('/api/auth',      authRoutes);
app.use('/api/quiz',      quizRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/professor', professorRoutes);
app.use('/api/chat',      chatRoutes);

app.get('/', (_, res) => res.json({ status: 'API Simpat.IA rodando.' }));

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Backend rodando em http://localhost:${PORT}`));
