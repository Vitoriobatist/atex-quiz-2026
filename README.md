# Base de Conhecimento — Agente de Suporte Simpat.IA

> Versão 1.0 — Módulo: Quiz Inteligente UNIFNAS  
> Usada como contexto estruturado nos prompts do agente de suporte.

---

## 1. O QUE É O SIMPAT.IA QUIZ

O Simpat.IA Quiz é um módulo da plataforma SIMPATIA que gera questões de múltipla escolha personalizadas com base nos materiais enviados pelo professor. O sistema usa IA (Groq API + LLaMA 3.3 70b) para criar questões inéditas a cada sessão de estudo.

**Perfis de usuário:**
- **Aluno**: faz quizzes, visualiza resultados, acessa dashboard de evolução, usa o tutor de revisão.
- **Professor**: cadastra disciplinas, faz upload de PDFs, acompanha métricas dos alunos.

---

## 2. FUNCIONALIDADES DO MÓDULO

### 2.1 Geração de Quiz (aluno)
- O aluno escolhe uma disciplina e define o número de questões (1 a 20).
- A IA lê o conteúdo do PDF da disciplina e gera questões com 4 alternativas, gabarito e justificativa.
- Cada sessão gera questões novas — não há banco fixo de questões.

### 2.2 Resultado e Revisão (aluno)
- Ao final do quiz, o aluno vê o gabarito com justificativas para cada questão.
- O botão **"Por que errei?"** abre o Tutor de Revisão focado na questão específica.
- O aluno pode conversar livremente com o tutor sobre qualquer questão do quiz.

### 2.3 Dashboard (aluno)
- 6 gráficos de desempenho: aproveitamento por quiz, evolução no tempo, acertos vs erros, média por tema, erros por tema, desempenho por dificuldade.

### 2.4 Gestão de Disciplinas (professor)
- Cadastro de disciplinas vinculadas a períodos letivos.
- Upload de PDFs que alimentam a IA.
- Visualização de histórico de quizzes dos alunos.

---

## 3. AGENTES DE SUPORTE DO SISTEMA

O sistema possui três modos de agente, todos implementados em `backend/src/routes/chat.js`:

| Agente | Tipo | Quem usa | Contexto recebido |
|---|---|---|---|
| Assistente do Aluno | `aluno` | Aluno fora do quiz | Nenhum (suporte ao sistema) |
| Assistente do Professor | `professor` | Professor | Nenhum (suporte ao sistema) |
| Tutor de Revisão | `revisao` | Aluno após quiz | Array completo de questões com resultados |

---

## 4. PERGUNTAS FREQUENTES (FAQ)

### 4.1 Perguntas do Aluno — Uso do Sistema

**P: Como faço um quiz?**
R: Na tela inicial, clique em "Iniciar Quiz", escolha a disciplina, selecione o número de questões (1–20) e clique em "Gerar". A IA vai criar as questões na hora.

**P: Por que as questões são diferentes toda vez?**
R: O sistema usa inteligência artificial para gerar questões novas em cada sessão, com base no conteúdo do PDF da disciplina. Não existe um banco de questões fixo.

**P: Posso refazer o mesmo quiz?**
R: Sim, mas as questões serão diferentes, pois são geradas dinamicamente pela IA a cada nova sessão.

**P: O que aparece no resultado?**
R: Ao finalizar, você vê o gabarito completo com a alternativa correta e uma justificativa para cada questão.

**P: Como funciona o "Por que errei?"**
R: Ao clicar nesse botão em uma questão errada, o Tutor de Revisão abre automaticamente já focado naquela questão. Você pode continuar perguntando sobre qualquer outra questão da mesma sessão.

**P: O tutor de revisão responde dúvidas gerais sobre a matéria?**
R: Não. O Tutor de Revisão responde apenas sobre as questões do quiz que você acabou de fazer. Para dúvidas gerais sobre o conteúdo, consulte o material da disciplina.

**P: Meu quiz ficou carregando e não gerou as questões. O que faço?**
R: Isso pode acontecer se o PDF da disciplina for muito grande ou se houver lentidão na conexão. Tente novamente. Se o problema persistir, avise seu professor.

**P: Por que não aparecem disciplinas para eu fazer o quiz?**
R: Você é vinculado às disciplinas pelo seu período letivo. Verifique se seu cadastro está com o período correto. Se o professor ainda não cadastrou PDFs para a disciplina, o quiz não pode ser gerado.

**P: O assistente do sistema não responde sobre conteúdo acadêmico. Por quê?**
R: O assistente de suporte é focado em ajudar com o uso da plataforma. Para dúvidas de conteúdo, use o Tutor de Revisão (disponível após fazer um quiz).

### 4.2 Perguntas do Professor — Uso do Sistema

**P: Como cadastro uma disciplina?**
R: Acesse o Painel do Professor, clique em "Nova Disciplina", preencha o nome e o período letivo.

**P: Como faço o upload do material?**
R: Na página de detalhes da disciplina, clique em "Enviar PDF". O arquivo deve estar em formato PDF. Após o upload, a IA já usa o conteúdo para gerar questões.

**P: Posso enviar mais de um PDF por disciplina?**
R: Sim. Cada PDF enviado é adicionado à base de conhecimento da disciplina. Quanto mais material, maior a variedade das questões geradas.

**P: Como vejo o desempenho dos alunos?**
R: No Painel do Professor, acesse a disciplina desejada para ver o histórico de quizzes dos alunos vinculados.

**P: Um aluno não consegue ver a disciplina no quiz. O que pode ser?**
R: Verifique se o período letivo do aluno no cadastro coincide com o período da disciplina. O vínculo é automático por período.

**P: O sistema aceita PDFs com imagens ou tabelas?**
R: O sistema extrai o texto do PDF. Imagens e tabelas sem texto não são processadas. Prefira PDFs com conteúdo textual.

---

## 5. ERROS COMUNS E SOLUÇÕES

| Erro | Causa provável | Solução |
|---|---|---|
| "Erro ao gerar questões" | PDF sem texto legível ou API temporariamente indisponível | Verificar se o PDF tem texto selecionável; tentar novamente |
| "Erro ao conectar com o assistente" | Timeout ou falha na API Groq | Aguardar e tentar novamente |
| "Disciplina sem material" | Professor não enviou PDF | Professor deve fazer upload de PDF na disciplina |
| Quiz não aparece para o aluno | Período letivo do aluno não coincide com a disciplina | Verificar período no cadastro do aluno |
| Login inválido | Senha errada ou e-mail não cadastrado | Verificar credenciais; usar o e-mail informado no cadastro |

---

## 6. LIMITAÇÕES DO SISTEMA

- **Qualidade das questões depende do PDF**: PDFs escaneados sem OCR ou com baixo conteúdo textual geram questões de menor qualidade.
- **Sem persistência das questões geradas**: cada sessão de quiz é única; não é possível recuperar questões de sessões anteriores.
- **O tutor de revisão não tem memória entre sessões**: ao fechar e reabrir o chat, o contexto anterior é perdido.
- **O assistente de suporte não responde sobre conteúdo acadêmico**: apenas sobre o funcionamento do sistema.
- **Latência variável**: a geração de questões e as respostas do chat dependem da disponibilidade e velocidade da API Groq.
- **Idioma**: o sistema opera exclusivamente em português.

---

## 7. REGRAS DE COMPORTAMENTO DO AGENTE

- Responder apenas sobre o uso do sistema Simpat.IA Quiz.
- Não responder perguntas de conteúdo acadêmico (exceto o Tutor de Revisão, que é contextual ao quiz).
- Ser claro, didático e encorajador.
- Quando não souber responder, indicar que o usuário procure o professor ou o suporte técnico.
- Nunca inventar funcionalidades que o sistema não possui.
- Operar de forma ética: não emitir julgamentos negativos sobre o desempenho do aluno.
