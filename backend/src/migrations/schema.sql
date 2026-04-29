-- ============================================================
-- SCHEMA COMPLETO — Simpat.IA Quiz
-- Execute este arquivo no MySQL antes de rodar o projeto
-- ============================================================

CREATE DATABASE IF NOT EXISTS atex_quiz
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE atex_quiz;

-- ------------------------------------------------------------
-- Alunos (também armazena o professor)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS alunos (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  nome        VARCHAR(120)  NOT NULL,
  email       VARCHAR(180)  NOT NULL UNIQUE,
  senha_hash  VARCHAR(255)  NOT NULL,
  periodo     TINYINT       NULL,
  criado_em   DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ------------------------------------------------------------
-- Matérias / Disciplinas
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS materias (
  id        INT AUTO_INCREMENT PRIMARY KEY,
  nome      VARCHAR(120) NOT NULL,
  descricao VARCHAR(255) NULL,
  periodo   TINYINT      NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ------------------------------------------------------------
-- Vínculo aluno ↔ matéria
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS aluno_materias (
  aluno_id   INT NOT NULL,
  materia_id INT NOT NULL,
  PRIMARY KEY (aluno_id, materia_id),
  FOREIGN KEY (aluno_id)   REFERENCES alunos(id)   ON DELETE CASCADE,
  FOREIGN KEY (materia_id) REFERENCES materias(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ------------------------------------------------------------
-- Tentativas de quiz
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tentativas (
  id               INT AUTO_INCREMENT PRIMARY KEY,
  aluno_id         INT          NOT NULL,
  materia_id       INT          NULL,
  tema             VARCHAR(120) NOT NULL DEFAULT 'Quiz',
  acertos          INT          NOT NULL DEFAULT 0,
  total_questoes   INT          NOT NULL DEFAULT 0,
  nivel            VARCHAR(20)  NOT NULL DEFAULT 'medio',
  nivel_rotulo     VARCHAR(30)  NOT NULL DEFAULT 'Médio',
  data_registro    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at       DATETIME     NULL,
  FOREIGN KEY (aluno_id)   REFERENCES alunos(id)   ON DELETE CASCADE,
  FOREIGN KEY (materia_id) REFERENCES materias(id) ON DELETE SET NULL,
  INDEX idx_aluno (aluno_id),
  INDEX idx_data  (data_registro)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ------------------------------------------------------------
-- Questões de cada tentativa
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS questoes (
  id                         INT AUTO_INCREMENT PRIMARY KEY,
  tentativa_id               INT  NOT NULL,
  pergunta                   TEXT NOT NULL,
  alternativas               JSON NOT NULL,
  correta                    TINYINT NOT NULL DEFAULT 0,
  selecionada                TINYINT NULL,
  justificativa_correta      TEXT NULL,
  justificativas_alternativas JSON NULL,
  FOREIGN KEY (tentativa_id) REFERENCES tentativas(id) ON DELETE CASCADE,
  INDEX idx_tentativa (tentativa_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ------------------------------------------------------------
-- Logs do agente de chat
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS chat_logs (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  user_id     INT         NOT NULL,
  tipo        VARCHAR(20) NOT NULL,
  pergunta    TEXT        NOT NULL,
  resposta    TEXT        NOT NULL,
  latencia_ms INT         NOT NULL,
  criado_em   DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_user_id   (user_id),
  INDEX idx_tipo      (tipo),
  INDEX idx_criado_em (criado_em)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
