const express = require('express');
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('cloudinary').v2;
const db = require('../db');
const { requireAuth } = require('./auth');

const router = express.Router();

// Configuração do Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Configuração do Multer com Cloudinary
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'namoro',
    allowed_formats: ['jpg', 'png', 'gif', 'jpeg', 'webp']
  }
});

const upload = multer({ storage: storage, limits: { fileSize: 10 * 1024 * 1024 } });

// Todas as rotas de fotos requerem autenticação
router.use(requireAuth);

// ============================================
// GET /api/fotos - Listar todas as fotos
// ============================================
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.execute('SELECT * FROM v_fotos ORDER BY criado_em DESC');
    
    // A URL segura já deve vir do banco de dados (que salvamos no POST)
    const fotos = rows.map(row => ({
      ...row,
      url: row.nome_arquivo // O banco guarda a URL completa agora
    }));

    res.json({ ok: true, fotos });
  } catch (error) {
    console.error(error);
    res.status(500).json({ ok: false, error: 'Erro ao buscar fotos' });
  }
});

// ============================================
// POST /api/fotos - Upload de foto
// ============================================
router.post('/', (req, res) => {
  upload.single('foto')(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ ok: false, error: err.message || 'Erro no upload' });
    }

    if (!req.file) {
      return res.status(400).json({ ok: false, error: 'Nenhum arquivo enviado' });
    }

    const { description: rawDescricao, descricao: ptDescricao } = req.body;
    const descricao = (ptDescricao || rawDescricao || '').trim();
    const tamanhoKb = Math.ceil(req.file.size / 1024);
    
    // Cloudinary URL and Public ID
    const fotoUrl = req.file.path; 
    const publicId = req.file.filename;

    try {
      // Salva a URL completa na coluna nome_arquivo e o public_id no nome_original (para poder deletar depois)
      const [result] = await db.execute(
        `INSERT INTO fotos (usuario_id, nome_arquivo, nome_original, descricao, tamanho_kb) 
         VALUES (?, ?, ?, ?, ?)`,
        [req.usuario.id, fotoUrl, publicId, descricao, tamanhoKb]
      );

      res.json({
        ok: true,
        foto: {
          id: result.insertId,
          url: fotoUrl,
          nome_arquivo: fotoUrl,
          nome_original: publicId,
          descricao,
          enviado_por: req.usuario.nome,
          criado_em: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error(error);
      // Se falhar no banco, tenta remover do cloudinary
      cloudinary.uploader.destroy(publicId).catch(console.error);
      res.status(500).json({ ok: false, error: 'Erro ao salvar registro no banco' });
    }
  });
});

// ============================================
// DELETE /api/fotos?id=X - Remover foto
// ============================================
router.delete('/', async (req, res) => {
  const id = parseInt(req.query.id);
  if (!id) return res.status(400).json({ ok: false, error: 'ID inválido' });

  try {
    const [rows] = await db.execute('SELECT * FROM fotos WHERE id = ?', [id]);
    const foto = rows[0];

    if (!foto) {
      return res.status(404).json({ ok: false, error: 'Foto não encontrada' });
    }

    // O public_id do Cloudinary está salvo em nome_original
    const publicId = foto.nome_original;
    if (publicId && publicId.startsWith('namoro/')) {
      await cloudinary.uploader.destroy(publicId);
    }

    await db.execute('DELETE FROM fotos WHERE id = ?', [id]);

    res.json({ ok: true, message: 'Foto removida com sucesso' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ ok: false, error: 'Erro ao remover foto' });
  }
});

module.exports = router;
