-- Tabela de logs das interações com os agentes de suporte
-- Executar manualmente no banco atex_quiz

CREATE TABLE IF NOT EXISTS chat_logs (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  user_id      INT          NOT NULL,
  tipo         VARCHAR(20)  NOT NULL,  -- 'aluno', 'professor', 'revisao'
  pergunta     TEXT         NOT NULL,
  resposta     TEXT         NOT NULL,
  latencia_ms  INT          NOT NULL,
  criado_em    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,

  INDEX idx_user_id   (user_id),
  INDEX idx_tipo      (tipo),
  INDEX idx_criado_em (criado_em)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
