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
| Professor | Acesso via e-mail institucional fixo, com permissões administrativas |

---

## Stack

- **Frontend:** React 18 + Vite + React Router + Chart.js
- **Backend:** Node.js + Express + MySQL + JWT
- **IA:** Groq API (modelos LLaMA)
- **Upload:** Multer (PDFs das disciplinas)
