# Documento de Arquitetura — Agente de Suporte Simpat.IA

> Versão 1.0 — ATEX/PII XIII e XIV  
> Módulo: Quiz Inteligente UNIFNAS

---

## 1. Visão Geral

O agente de suporte do Simpat.IA Quiz é implementado com arquitetura **Prompt-Based**, sem RAG. O conhecimento do agente é fornecido diretamente pelo prompt de sistema (system message), construído dinamicamente conforme o perfil do usuário e o contexto da interação.

Toda comunicação passa pela rota `/api/chat` do backend, que recebe a pergunta do usuário, monta o prompt adequado, consulta o modelo de linguagem via API e retorna a resposta.

---

## 2. Componentes

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND (React)                         │
│                                                                 │
│   ┌──────────────┐   ┌──────────────┐   ┌──────────────────┐   │
│   │ ChatWidget   │   │ ChatWidget   │   │   ChatWidget     │   │
│   │ tipo=aluno   │   │ tipo=prof.   │   │ tipo=revisao     │   │
│   └──────┬───────┘   └──────┬───────┘   └────────┬─────────┘   │
│          │                  │                     │             │
│          └──────────────────┴─────────────────────┘             │
│                             │ POST /api/chat                    │
│                    { pergunta, tipo, contexto? }                 │
└─────────────────────────────┬───────────────────────────────────┘
                              │ JWT auth
┌─────────────────────────────▼───────────────────────────────────┐
│                       BACKEND (Node.js/Express)                  │
│                                                                  │
│   ┌──────────────────────────────────────────────────────────┐   │
│   │                  routes/chat.js                          │   │
│   │                                                          │   │
│   │   1. authMiddleware (valida JWT)                         │   │
│   │   2. Seleciona tipo de prompt:                           │   │
│   │      ├── tipo=revisao → buildRevisaoPrompt(contexto)     │   │
│   │      ├── tipo=professor → prompt assistente prof.        │   │
│   │      └── default → prompt assistente aluno               │   │
│   │   3. Chama Groq API                                      │   │
│   │   4. Salva log no banco (chat_logs)                      │   │
│   │   5. Retorna { resposta }                                │   │
│   └──────────────────────────┬───────────────────────────────┘   │
│                              │                                   │
│   ┌──────────────────────────▼────────┐  ┌──────────────────┐   │
│   │           MySQL (chat_logs)       │  │   MySQL (dados)  │   │
│   │  id, user_id, tipo, pergunta,     │  │  users, quizzes, │   │
│   │  resposta, latencia_ms, ts        │  │  disciplinas...  │   │
│   └───────────────────────────────────┘  └──────────────────┘   │
└─────────────────────────────┬───────────────────────────────────┘
                              │ HTTPS
┌─────────────────────────────▼───────────────────────────────────┐
│                       GROQ API                                   │
│                  Modelo: llama-3.3-70b-versatile                 │
│                  temperature: 0.7 / max_tokens: 600              │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3. Fluxo de Interação

### 3.1 Fluxo Geral

```
Usuário digita pergunta
        │
        ▼
ChatWidget.jsx monta payload
{ pergunta, tipo, contexto? }
        │
        ▼
POST /api/chat  ──► authMiddleware
                         │
                    JWT válido?
                   /           \
                 Não            Sim
                  │              │
               401             Seleciona prompt
                                 │
              ┌──────────────────┼───────────────────┐
              │                  │                   │
          tipo=revisao      tipo=professor       tipo=aluno
              │                  │                   │
    buildRevisaoPrompt()   Prompt professor    Prompt aluno
    (inclui questões         (sistema fixo)    (sistema fixo)
     e resultados)
              │                  │                   │
              └──────────────────┴───────────────────┘
                                 │
                         Chama Groq API
                                 │
                         Salva em chat_logs
                                 │
                         Retorna { resposta }
                                 │
                        ChatWidget exibe resposta
```

### 3.2 Fluxo Tutor de Revisão (detalhe)

```
Aluno clica "Por que errei?" na questão N
        │
        ▼
ChatWidget abre com questaoFoco=N
        │
        ▼
Auto-envia: "Por que errei a questão N?"
        │
        ▼
Payload: { tipo: 'revisao', contexto: { questoes: [...], questaoFoco: N } }
        │
        ▼
buildRevisaoPrompt() serializa todas as questões
(número, enunciado, alternativas, resposta correta, resposta do aluno, acertou/errou)
        │
        ▼
LLM recebe contexto completo + foco na questão N
        │
        ▼
Resposta explicando o erro do aluno
```

---

## 4. Definição dos Prompts (Persona e Regras)

### 4.1 Assistente do Aluno

**Persona:** Assistente amigável e didático do sistema Simpat.IA Quiz.

**Regras:**
- Responder apenas sobre o funcionamento do sistema (como gerar quiz, como acessar resultados, etc.).
- Nunca responder perguntas de conteúdo acadêmico.
- Se perguntado sobre conteúdo: _"Eu ajudo apenas com dúvidas sobre como usar o sistema 😊"_

### 4.2 Assistente do Professor

**Persona:** Assistente profissional para professores da plataforma.

**Regras:**
- Ajudar com cadastro de disciplinas, upload de PDFs, interpretação de métricas.
- Nunca responder perguntas de conteúdo acadêmico.
- Ser claro, direto e profissional.

### 4.3 Tutor de Revisão

**Persona:** Tutor acadêmico contextual pós-quiz.

**Regras:**
- Recebe o gabarito completo do quiz como contexto.
- Explicar por que a alternativa do aluno estava errada.
- Explicar por que a alternativa correta está certa.
- Linguagem encorajadora e didática.
- Responder apenas sobre as questões do quiz atual.

---

## 5. Parâmetros do Modelo

| Parâmetro | Valor |
|---|---|
| Modelo | `llama-3.3-70b-versatile` |
| Temperatura | `0.7` |
| Max tokens | `600` |
| Timeout | `30 000 ms` |
| Provedor | Groq API |

---

## 6. Segurança e Limites

- Todas as requisições ao `/api/chat` requerem JWT válido (authMiddleware).
- O agente não tem acesso a dados de outros usuários.
- Contexto de revisão é construído exclusivamente no servidor, nunca exposto via URL.
- O agente não executa código nem acessa sistemas externos além da Groq API.

---

## 7. Decisões de Arquitetura

| Decisão | Escolha | Justificativa |
|---|---|---|
| Arquitetura do agente | Prompt-Based (sem RAG) | O domínio é pequeno e bem definido; o conhecimento cabe no prompt de sistema sem necessidade de busca vetorial |
| Modelo LLM | LLaMA 3.3 70b via Groq | Alta capacidade em português, baixa latência via Groq, sem custo por token para prototipagem |
| Histórico de conversa | Sem histórico (stateless) | Simplifica a implementação; cada pergunta é auto-suficiente no contexto do módulo |
| Contexto de revisão | Serializado no prompt | Permite que o tutor tenha visão completa do quiz sem precisar de banco vetorial |
