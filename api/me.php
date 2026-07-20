<?php
// ============================================
// api/me.php — Retorna dados do usuário logado
// ============================================
require_once __DIR__ . '/config.php';

$usuario = requireAuth();
jsonOk(['usuario' => $usuario]);
