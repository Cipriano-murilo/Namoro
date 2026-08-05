const express = require('express');
const db = require('../db');
const { requireAuth } = require('./auth');

const router = express.Router();

router.use(requireAuth);

// ============================================
// GET /api/sentimentos - Listar mensagens
// ============================================
router.get('/', async (req, res) => {
  const limit = Math.min(parseInt(req.query.limit) || 50, 100);
  
  try {
    const [rows] = await db.execute('SELECT * FROM v_sentimentos LIMIT ?', [limit]);
    res.json({ ok: true, sentimentos: rows });
  } catch (error) {
    console.error(error);
    res.status(500).json({ ok: false, error: 'Erro ao buscar sentimentos' });
  }
});

// ============================================
// POST /api/sentimentos - Nova mensagem
// ============================================
router.post('/', async (req, res) => {
  const mensagem = (req.body.mensagem || '').trim();
  const emoji = (req.body.emoji || '💕').substring(0, 10);

  if (!mensagem) return res.status(400).json({ ok: false, error: 'Mensagem não pode ser vazia' });
  if (mensagem.length > 2000) return res.status(400).json({ ok: false, error: 'Mensagem muito longa' });

  try {
    const [result] = await db.execute(
      'INSERT INTO sentimentos (usuario_id, mensagem, emoji) VALUES (?, ?, ?)',
      [req.usuario.id, mensagem, emoji]
    );

    res.json({
      ok: true,
      sentimento: {
        id: result.insertId,
        mensagem,
        emoji,
        autor: req.usuario.nome,
        username: req.usuario.username,
        criado_em: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ ok: false, error: 'Erro ao salvar sentimento' });
  }
});

// ============================================
// DELETE /api/sentimentos?id=X - Remover mensagem
// ============================================
router.delete('/', async (req, res) => {
  const id = parseInt(req.query.id);
  if (!id) return res.status(400).json({ ok: false, error: 'ID inválido' });

  try {
    const [rows] = await db.execute('SELECT usuario_id FROM sentimentos WHERE id = ?', [id]);
    if (!rows.length) return res.status(404).json({ ok: false, error: 'Mensagem não encontrada' });

    // Privado, qualquer um dos dois pode apagar, mas mantendo a lógica de segurança
    await db.execute('DELETE FROM sentimentos WHERE id = ?', [id]);
    res.json({ ok: true, message: 'Mensagem removida' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ ok: false, error: 'Erro ao remover mensagem' });
  }
});

module.exports = router;
