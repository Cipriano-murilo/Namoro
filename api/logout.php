<?php
// ============================================
// api/logout.php — Encerra a sessão
// ============================================
require_once __DIR__ . '/config.php';

$token = $_COOKIE[COOKIE_NAME] ?? null;
if ($token) {
    getDB()->prepare("DELETE FROM sessoes WHERE token = ?")->execute([$token]);
}

setcookie(COOKIE_NAME, '', time() - 3600, '/');
jsonOk(['message' => 'Logout realizado']);
