<?php
// ============================================
// api/fotos.php — CRUD de fotos da galeria
// ============================================
require_once __DIR__ . '/config.php';

$usuario = requireAuth();
$method  = $_SERVER['REQUEST_METHOD'];

// ── GET /api/fotos.php — listar todas as fotos
if ($method === 'GET') {
    $db   = getDB();
    $rows = $db->query("SELECT * FROM v_fotos")->fetchAll();

    // Adicionar URL completa
    foreach ($rows as &$row) {
        $row['url'] = UPLOAD_URL . $row['nome_arquivo'];
    }

    jsonOk(['fotos' => $rows]);
}

// ── POST /api/fotos.php — upload de foto
if ($method === 'POST') {
    if (empty($_FILES['foto'])) jsonErr('Nenhum arquivo enviado');

    $file  = $_FILES['foto'];
    $descr = trim($_POST['descricao'] ?? '');

    // Validações
    if ($file['error'] !== UPLOAD_ERR_OK)       jsonErr('Erro no upload');
    if ($file['size'] > MAX_FILE_SIZE)           jsonErr('Arquivo muito grande (máximo 10 MB)');
    if (!in_array($file['type'], ALLOWED_TYPES)) jsonErr('Tipo de arquivo não permitido');

    // Nome único
    $ext      = pathinfo($file['name'], PATHINFO_EXTENSION);
    $nomeArq  = uniqid('foto_', true) . '.' . strtolower($ext);
    $destino  = UPLOAD_DIR . $nomeArq;

    if (!move_uploaded_file($file['tmp_name'], $destino)) {
        jsonErr('Falha ao salvar o arquivo no servidor', 500);
    }

    $tamanhoKb = (int) ceil($file['size'] / 1024);

    $db = getDB();
    $db->prepare("
        INSERT INTO fotos (usuario_id, nome_arquivo, nome_original, descricao, tamanho_kb)
        VALUES (?, ?, ?, ?, ?)
    ")->execute([$usuario['id'], $nomeArq, $file['name'], $descr, $tamanhoKb]);

    $id = $db->lastInsertId();

    jsonOk([
        'foto' => [
            'id'           => $id,
            'url'          => UPLOAD_URL . $nomeArq,
            'nome_arquivo' => $nomeArq,
            'nome_original'=> $file['name'],
            'descricao'    => $descr,
            'enviado_por'  => $usuario['nome'],
            'criado_em'    => date('Y-m-d H:i:s'),
        ]
    ]);
}

// ── DELETE /api/fotos.php?id=X — remover foto
if ($method === 'DELETE') {
    $id = (int) ($_GET['id'] ?? 0);
    if (!$id) jsonErr('ID inválido');

    $db   = getDB();
    $foto = $db->prepare("SELECT * FROM fotos WHERE id = ?")->execute([$id]) && true
        ? $db->query("SELECT * FROM fotos WHERE id = $id")->fetch()
        : null;

    // Buscar a foto
    $stmt = $db->prepare("SELECT * FROM fotos WHERE id = ?");
    $stmt->execute([$id]);
    $foto = $stmt->fetch();

    if (!$foto) jsonErr('Foto não encontrada', 404);

    // Remover arquivo do disco
    $arquivo = UPLOAD_DIR . $foto['nome_arquivo'];
    if (file_exists($arquivo)) unlink($arquivo);

    $db->prepare("DELETE FROM fotos WHERE id = ?")->execute([$id]);

    jsonOk(['message' => 'Foto removida com sucesso']);
}

jsonErr('Método não suportado', 405);
