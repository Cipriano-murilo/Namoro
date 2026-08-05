const express = require('express');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const db = require('../db');

const router = express.Router();
const COOKIE_NAME = 'namoro_session';
const SESSION_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 dias em milissegundos

// Helper para enviar erro
const jsonErr = (res, msg, code = 400) => res.status(code).json({ ok: false, error: msg });

// ============================================
// POST /api/login
// ============================================
router.post('/login', async (req, res) => {
  const { username, senha } = req.body;

  if (!username || !senha) {
    return jsonErr(res, 'Usuário e senha obrigatórios');
  }

  try {
    const [rows] = await db.execute('SELECT * FROM usuarios WHERE username = ?', [username]);
    const usuario = rows[0];

    if (!usuario || !(await bcrypt.compare(senha, usuario.senha_hash))) {
      return jsonErr(res, 'Usuário ou senha incorretos', 401);
    }

    // Criar token de sessão (128 chars = 64 bytes hex)
    const token = crypto.randomBytes(64).toString('hex');
    const expiraEm = new Date(Date.now() + SESSION_DURATION);

    await db.execute('INSERT INTO sessoes (token, usuario_id, expira_em) VALUES (?, ?, ?)', [
      token,
      usuario.id,
      expiraEm
    ]);

    res.cookie(COOKIE_NAME, token, {
      maxAge: SESSION_DURATION,
      httpOnly: true,
      path: '/',
      sameSite: 'Lax',
      secure: process.env.NODE_ENV === 'production' // HTTPS no Render
    });

    res.json({
      ok: true,
      token,
      usuario: {
        id: usuario.id,
        nome: usuario.nome,
        username: usuario.username,
        avatar_url: usuario.avatar_url
      }
    });
  } catch (error) {
    console.error(error);
    jsonErr(res, 'Erro interno do servidor', 500);
  }
});

// ============================================
// GET /api/logout
// ============================================
router.get('/logout', async (req, res) => {
  const token = req.cookies[COOKIE_NAME];
  if (token) {
    try {
      await db.execute('DELETE FROM sessoes WHERE token = ?', [token]);
    } catch (e) {
      console.error(e);
    }
  }
  res.clearCookie(COOKIE_NAME);
  res.json({ ok: true, message: 'Logout realizado' });
});

// ============================================
// GET /api/me
// ============================================
router.get('/me', async (req, res) => {
  const usuario = req.usuario; // Vem do middleware de autenticação
  if (!usuario) return jsonErr(res, 'Não autenticado', 401);
  
  res.json({ ok: true, usuario });
});

// Middleware de autenticação para exportar e usar em outras rotas
router.requireAuth = async (req, res, next) => {
  let token = req.cookies[COOKIE_NAME];
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  }

  if (!token) return jsonErr(res, 'Não autenticado', 401);

  try {
    const [rows] = await db.execute(`
      SELECT u.id, u.nome, u.username, u.avatar_url
      FROM sessoes s
      JOIN usuarios u ON u.id = s.usuario_id
      WHERE s.token = ? AND s.expira_em > NOW()
    `, [token]);

    const usuario = rows[0];
    if (!usuario) return jsonErr(res, 'Sessão inválida ou expirada', 401);

    req.usuario = usuario;
    next();
  } catch (error) {
    console.error(error);
    jsonErr(res, 'Erro interno do servidor', 500);
  }
};

module.exports = router;
