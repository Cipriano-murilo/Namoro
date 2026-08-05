const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));

// Servir arquivos estáticos do frontend
app.use(express.static(path.join(__dirname, '../public')));

// Rotas da API
const authRoutes = require('./routes/auth');
const fotosRoutes = require('./routes/fotos');
const sentimentosRoutes = require('./routes/sentimentos');

app.use('/api', authRoutes);
app.use('/api/fotos', fotosRoutes);
app.use('/api/sentimentos', sentimentosRoutes);

// Fallback para SPA ou páginas não encontradas
app.use((req, res, next) => {
  if (req.method === 'GET' && !req.path.startsWith('/api')) {
    res.sendFile(path.join(__dirname, '../public/index.html'));
  } else {
    next();
  }
});

// Tratamento de erros global
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ ok: false, error: 'Ocorreu um erro interno no servidor.' });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
  console.log(`👉 Acesse: http://localhost:${PORT}`);
});
