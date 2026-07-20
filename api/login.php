<?php
// ============================================
// api/login.php — Autenticação do usuário
// ============================================
require_once __DIR__ . '/config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') jsonErr('Método inválido', 405);

$body = json_decode(file_get_contents('php://input'), true);
$username = trim($body['username'] ?? '');
$senha    = trim($body['senha'] ?? '');

if (!$username || !$senha) jsonErr('Usuário e senha obrigatórios');

$db = getDB();

// Buscar usuário
$stmt = $db->prepare("SELECT id, nome, username, senha_hash, avatar_url FROM usuarios WHERE username = ?");
$stmt->execute([$username]);
$usuario = $stmt->fetch();

if (!$usuario || !password_verify($senha, $usuario['senha_hash'])) {
    jsonErr('Usuário ou senha incorretos', 401);
}

// Criar token de sessão
$token    = bin2hex(random_bytes(64));
$expiraEm = date('Y-m-d H:i:s', time() + SESSION_DURATION);

$db->prepare("INSERT INTO sessoes (token, usuario_id, expira_em) VALUES (?, ?, ?)")
   ->execute([$token, $usuario['id'], $expiraEm]);

// Definir cookie
setcookie(COOKIE_NAME, $token, [
    'expires'  => time() + SESSION_DURATION,
    'path'     => '/',
    'httponly' => true,
    'samesite' => 'Lax',
]);

jsonOk([
    'token'   => $token,
    'usuario' => [
        'id'         => $usuario['id'],
        'nome'       => $usuario['nome'],
        'username'   => $usuario['username'],
        'avatar_url' => $usuario['avatar_url'],
    ]
]);
