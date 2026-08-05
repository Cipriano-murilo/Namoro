CREATE DATABASE IF NOT EXISTS namoro_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE namoro_db;

-- ============================================
-- TABELA: usuarios
-- Contas pré-criadas pelo administrador
-- ============================================
CREATE TABLE IF NOT EXISTS usuarios (
  id          INT UNSIGNED    NOT NULL AUTO_INCREMENT,
  nome        VARCHAR(100)    NOT NULL,
  username    VARCHAR(50)     NOT NULL UNIQUE,
  senha_hash  VARCHAR(255)    NOT NULL,  -- bcrypt hash
  avatar_url  VARCHAR(500)    NULL,
  criado_em   DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_username (username)
) ENGINE=InnoDB;

-- ============================================
-- TABELA: fotos
-- Galeria de fotos do casal
-- ============================================
CREATE TABLE IF NOT EXISTS fotos (
  id           INT UNSIGNED    NOT NULL AUTO_INCREMENT,
  usuario_id   INT UNSIGNED    NOT NULL,
  nome_arquivo VARCHAR(255)    NOT NULL,
  nome_original VARCHAR(255)  NOT NULL,
  descricao    VARCHAR(500)    NULL,
  tamanho_kb   INT UNSIGNED    NOT NULL DEFAULT 0,
  criado_em    DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_usuario (usuario_id),
  INDEX idx_data (criado_em),
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ============================================
-- TABELA: sentimentos
-- Mensagens de sentimentos trocadas pelo casal
-- ============================================
CREATE TABLE IF NOT EXISTS sentimentos (
  id           INT UNSIGNED    NOT NULL AUTO_INCREMENT,
  usuario_id   INT UNSIGNED    NOT NULL,
  mensagem     TEXT            NOT NULL,
  emoji        VARCHAR(10)     NULL DEFAULT '💕',
  criado_em    DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_usuario (usuario_id),
  INDEX idx_data (criado_em DESC),
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ============================================
-- TABELA: sessoes
-- Sessões ativas dos usuários
-- ============================================
CREATE TABLE IF NOT EXISTS sessoes (
  token        VARCHAR(128)    NOT NULL,
  usuario_id   INT UNSIGNED    NOT NULL,
  expira_em    DATETIME        NOT NULL,
  criado_em    DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (token),
  INDEX idx_usuario (usuario_id),
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ============================================
-- DADOS INICIAIS: 2 contas pré-criadas
-- Senha padrão: "namoro2025" (bcrypt hash abaixo)
-- !! ALTERE as senhas após o primeiro login !!
-- Para gerar novo hash: password_hash('suasenha', PASSWORD_BCRYPT)
-- ============================================
INSERT INTO usuarios (nome, username, senha_hash) VALUES
-- Senha: amor25
('Murilo', 'murilo',
 '$2y$10$mefvScaeLapDPSUNoNJ3wuADIcwz7sa2WyKbVpiXgoKFPUDVSCx6m'),
-- Senha: amor25
('Maria Luiza', 'marialuiza',
 '$2y$10$mefvScaeLapDPSUNoNJ3wuADIcwz7sa2WyKbVpiXgoKFPUDVSCx6m');

-- ============================================
-- VIEWS úteis
-- ============================================

-- Fotos com nome do usuário que enviou
CREATE OR REPLACE VIEW v_fotos AS
SELECT
  f.id,
  f.nome_arquivo,
  f.nome_original,
  f.descricao,
  f.tamanho_kb,
  f.criado_em,
  u.nome AS enviado_por,
  u.username
FROM fotos f
JOIN usuarios u ON u.id = f.usuario_id
ORDER BY f.criado_em DESC;

-- Sentimentos com nome do usuário
CREATE OR REPLACE VIEW v_sentimentos AS
SELECT
  s.id,
  s.mensagem,
  s.emoji,
  s.criado_em,
  u.nome AS autor,
  u.username
FROM sentimentos s
JOIN usuarios u ON u.id = s.usuario_id
ORDER BY s.criado_em DESC;

-- ============================================
-- LIMPEZA DE SESSÕES EXPIRADAS (executar periodicamente)
-- DELETE FROM sessoes WHERE expira_em < NOW();
-- ============================================
