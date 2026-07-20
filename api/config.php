<?php
// ============================================
// config.php — Configurações do banco de dados
// ============================================

define('DB_HOST', 'localhost');
define('DB_NAME', 'namoro_db');
define('DB_USER', 'root');       // Altere para seu usuário MySQL
define('DB_PASS', '');           // Altere para sua senha MySQL
define('DB_CHARSET', 'utf8mb4');

define('UPLOAD_DIR', __DIR__ . '/uploads/');
define('UPLOAD_URL', 'uploads/');
define('MAX_FILE_SIZE', 10 * 1024 * 1024); // 10 MB
define('ALLOWED_TYPES', ['image/jpeg', 'image/png', 'image/gif', 'image/webp']);

define('SESSION_DURATION', 7 * 24 * 60 * 60); // 7 dias em segundos
define('COOKIE_NAME', 'namoro_session');

// Criar pasta de uploads se não existir
if (!is_dir(UPLOAD_DIR)) {
    mkdir(UPLOAD_DIR, 0755, true);
}

// ============================================
// Conexão PDO
// ============================================
function getDB(): PDO {
    static $pdo = null;
    if ($pdo === null) {
        $dsn = "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=" . DB_CHARSET;
        $pdo = new PDO($dsn, DB_USER, DB_PASS, [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES   => false,
        ]);
    }
    return $pdo;
}

// ============================================
// Helpers de resposta JSON
// ============================================
function jsonOk(array $data = []): void {
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(['ok' => true, ...$data]);
    exit;
}

function jsonErr(string $msg, int $code = 400): void {
    http_response_code($code);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(['ok' => false, 'error' => $msg]);
    exit;
}

// ============================================
// Autenticação via cookie/token
// ============================================
function getUsuarioLogado(): ?array {
    $token = $_COOKIE[COOKIE_NAME] ?? null;
    if (!$token) return null;

    $db = getDB();
    $stmt = $db->prepare("
        SELECT u.id, u.nome, u.username, u.avatar_url
        FROM sessoes s
        JOIN usuarios u ON u.id = s.usuario_id
        WHERE s.token = ? AND s.expira_em > NOW()
    ");
    $stmt->execute([$token]);
    return $stmt->fetch() ?: null;
}

function requireAuth(): array {
    $u = getUsuarioLogado();
    if (!$u) jsonErr('Não autenticado', 401);
    return $u;
}

// Headers CORS para desenvolvimento local
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Access-Control-Allow-Credentials: true');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') exit;
