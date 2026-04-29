# Simpat.IA — Quiz Inteligente UNIFNAS

Simpat.IA é uma plataforma de estudos desenvolvida para os alunos e professores da **UNIFNAS**. O sistema usa inteligência artificial para gerar questões de múltipla escolha personalizadas com base no conteúdo das disciplinas do curso, tornando o processo de revisão e fixação de conteúdo mais dinâmico e eficiente.

---

## O que é o projeto

A plataforma funciona como um ciclo completo de aprendizagem:

1. O **professor** cadastra as disciplinas e faz upload dos materiais em PDF.
2. A **IA** (via Groq) lê o conteúdo desses materiais e gera questões inéditas a cada sessão.
3. O **aluno** responde as questões, recebe feedback imediato e pode revisar o que errou com a ajuda de um assistente de IA.
4. O **dashboard** exibe gráficos detalhados de evolução, aproveitamento por tema e desempenho por nível de dificuldade.

---

## Funcionalidades

### Para o aluno
- Cadastro por período letivo, com vínculo automático às disciplinas correspondentes
- Geração de quizzes sob demanda — escolhe a matéria e quantas questões quer (1 a 20)
- Resultado detalhado ao final de cada quiz com gabarito e explicações
- Revisão guiada por IA: o aluno pode perguntar sobre qualquer questão que errou
- Dashboard pessoal com 6 gráficos: aproveitamento por quiz, evolução no tempo, acertos vs erros, média por tema, erros por tema e desempenho por dificuldade
- Chat de suporte integrado

### Para o professor
- Painel de controle com métricas gerais: total de alunos, disciplinas e vínculos
- Cadastro e gerenciamento de disciplinas por período
- Upload de PDFs que alimentam a base de conhecimento da IA
- Visão do histórico de quizzes dos alunos

---

## Como a IA funciona

O conteúdo dos PDFs enviados pelo professor é extraído e enviado como contexto para o modelo de linguagem da **Groq**. A partir desse contexto, o modelo gera questões de múltipla escolha com 4 alternativas, gabarito e justificativa — tudo adaptado ao nível do material da disciplina.

O mesmo modelo é usado no chat de revisão, onde o aluno pode tirar dúvidas sobre as questões que errou, recebendo explicações contextualizadas com base no conteúdo da prova que acabou de fazer.

---

## Perfis de acesso

| Perfil | Descrição |
|--------|-----------|
| Aluno | Acesso via cadastro com e-mail e senha |
| Professor | `pedro.professor@gmail.com` — acesso com permissões administrativas |

---

## Stack

- **Frontend:** React 18 + Vite + React Router + Chart.js
- **Backend:** Node.js + Express + MySQL + JWT
- **IA:** Groq API (LLaMA 3.3 70b)
- **Upload:** Multer (PDFs das disciplinas)

---

## Como rodar localmente

### Pré-requisitos

Instale antes de começar:

- [Node.js 18+](https://nodejs.org) — `node -v` para verificar
- [MySQL 8+](https://dev.mysql.com/downloads/) ou [XAMPP](https://www.apachefriends.org/)
- [Git](https://git-scm.com/)

---

### 1. Clonar o repositório

```bash
git clone https://github.com/seu-usuario/atex-quiz-2026.git
cd atex-quiz-2026
```

---

### 2. Criar o banco de dados

Abra o MySQL Workbench (ou phpMyAdmin no XAMPP) e execute o arquivo:

```
backend/src/migrations/schema.sql
```

Isso vai criar o banco `atex_quiz` com todas as tabelas necessárias.

---

### 3. Configurar as variáveis de ambiente do backend

```bash
cd backend
cp .env.example .env
```

Abra o `.env` e preencha:

```env
DB_HOST=127.0.0.1
DB_PORT=3306
DB_NAME=atex_quiz
DB_USER=root
DB_PASS=           # sua senha do MySQL (vazio se não tiver)

JWT_SECRET=qualquer_string_longa_e_aleatoria

GROQ_API_KEY=gsk_...   # obtenha em https://console.groq.com (gratuito)

PORT=3001
```

> **Como obter a chave Groq:**
> 1. Acesse [console.groq.com](https://console.groq.com)
> 2. Crie uma conta gratuita
> 3. Vá em **API Keys → Create API Key**
> 4. Cole a chave no `.env`

---

### 4. Instalar dependências e rodar o backend

```bash
# dentro da pasta backend
npm install
npm run dev
```

O backend vai iniciar em `http://localhost:3001`.  
Você deve ver: `Backend rodando em http://localhost:3001`

---

### 5. Instalar dependências e rodar o frontend

Abra um **novo terminal**:

```bash
cd frontend
npm install
npm run dev
```

O frontend vai iniciar em `http://localhost:5173`.

---

### 6. Acessar o sistema

Abra o navegador em **http://localhost:5173**

**Primeiro acesso:**
1. Clique em **Cadastrar** e crie uma conta de aluno
2. Para acessar como professor, use o e-mail `pedro.professor@gmail.com` com a senha que você definir diretamente no banco

> Para cadastrar o professor manualmente no banco:
> ```sql
> INSERT INTO alunos (nome, email, senha_hash, periodo)
> VALUES ('Professor', 'pedro.professor@gmail.com', 'sua_senha', NULL);
> ```

---

### Estrutura de pastas

```
atex-quiz-2026/
├── frontend/          # React + Vite
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── context/
│   │   └── services/
│   └── public/        # imagens (logo, hero)
│
├── backend/           # Node.js + Express
│   ├── src/
│   │   ├── routes/    # auth, quiz, chat, dashboard, professor
│   │   ├── middleware/
│   │   ├── migrations/ # schema.sql + create_chat_logs.sql
│   │   └── server.js
│   ├── uploads/       # PDFs enviados pelo professor (criado automaticamente)
│   └── .env.example
│
└── docs/              # Documentação técnica (ATEX)
    ├── ARQUITETURA.md
    ├── knowledge-base.md
    └── TECNOLOGIAS.md
```

---

### Problemas comuns

| Problema | Solução |
|---|---|
| `GROQ_API_KEY não configurada` | Verifique se o `.env` está na pasta `backend/` |
| `Erro ao conectar com o banco` | Confirme que o MySQL está rodando e os dados do `.env` estão corretos |
| `Cannot find module 'pdf-parse'` | Rode `npm install` dentro da pasta `backend/` |
| Questões sobre "PDF" em vez do conteúdo | O PDF pode ser escaneado (imagem). Use PDFs com texto selecionável |
| Frontend não conecta no backend | Confirme que o backend está rodando na porta 3001 |
