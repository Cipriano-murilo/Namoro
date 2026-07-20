<?php
// ============================================
// api/sentimentos.php — CRUD de mensagens
// ============================================
require_once __DIR__ . '/config.php';

$usuario = requireAuth();
$method  = $_SERVER['REQUEST_METHOD'];

// ── GET — listar mensagens (mais recentes primeiro)
if ($method === 'GET') {
    $limit = min((int)($_GET['limit'] ?? 50), 100);
    $db    = getDB();
    $rows  = $db->prepare("SELECT * FROM v_sentimentos LIMIT ?");
    $rows->execute([$limit]);

    jsonOk(['sentimentos' => $rows->fetchAll()]);
}

// ── POST — enviar nova mensagem
if ($method === 'POST') {
    $body     = json_decode(file_get_contents('php://input'), true);
    $mensagem = trim($body['mensagem'] ?? '');
    $emoji    = mb_substr(trim($body['emoji'] ?? '💕'), 0, 10);

    if (!$mensagem) jsonErr('Mensagem não pode ser vazia');
    if (mb_strlen($mensagem) > 2000) jsonErr('Mensagem muito longa (máximo 2000 caracteres)');

    $db = getDB();
    $db->prepare("
        INSERT INTO sentimentos (usuario_id, mensagem, emoji) VALUES (?, ?, ?)
    ")->execute([$usuario['id'], $mensagem, $emoji]);

    $id = $db->lastInsertId();

    jsonOk([
        'sentimento' => [
            'id'        => $id,
            'mensagem'  => $mensagem,
            'emoji'     => $emoji,
            'autor'     => $usuario['nome'],
            'username'  => $usuario['username'],
            'criado_em' => date('Y-m-d H:i:s'),
        ]
    ]);
}

// ── DELETE — remover mensagem própria
if ($method === 'DELETE') {
    $id = (int)($_GET['id'] ?? 0);
    if (!$id) jsonErr('ID inválido');

    $db   = getDB();
    $stmt = $db->prepare("SELECT usuario_id FROM sentimentos WHERE id = ?");
    $stmt->execute([$id]);
    $row  = $stmt->fetch();

    if (!$row) jsonErr('Mensagem não encontrada', 404);
    // Qualquer um dos dois pode deletar (site privado do casal)

    $db->prepare("DELETE FROM sentimentos WHERE id = ?")->execute([$id]);
    jsonOk(['message' => 'Mensagem removida']);
}

jsonErr('Método não suportado', 405);
