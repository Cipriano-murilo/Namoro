require('dotenv').config();
const mysql = require('mysql2/promise');

// Suporta tanto DATABASE_URL (string de conexão completa) quanto variáveis separadas
let pool;

if (process.env.DATABASE_URL) {
  pool = mysql.createPool(process.env.DATABASE_URL + '?ssl-mode=REQUIRED');
} else {
  pool = mysql.createPool({
    host:     process.env.DB_HOST     || 'localhost',
    port:     parseInt(process.env.DB_PORT) || 3306,
    user:     process.env.DB_USER     || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME     || 'namoro_db',
    ssl:      { rejectUnauthorized: false },
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  });
}

// Testa a conexão ao iniciar e loga qualquer erro detalhado
pool.getConnection()
  .then(conn => {
    console.log('✅ Banco de dados conectado com sucesso!');
    conn.release();
  })
  .catch(err => {
    console.error('❌ FALHA NA CONEXÃO COM O BANCO:', err.message);
    console.error('   Host:', process.env.DB_HOST);
    console.error('   Port:', process.env.DB_PORT);
    console.error('   User:', process.env.DB_USER);
    console.error('   Database:', process.env.DB_NAME);
  });

module.exports = pool;
