<?php
/**
 * API do cardápio.
 *   GET  catalog.php                -> cardápio salvo (público, é o que o site exibe)
 *   GET  catalog.php?action=verify  -> confere o código secreto do editor (cabeçalho X-Editor-Token)
 *   POST catalog.php                -> salva o cardápio (exige X-Editor-Token)
 */
define('TDD_API', true);
require __DIR__ . '/_common.php';

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

if ($method === 'GET') {
    if (($_GET['action'] ?? '') === 'verify') {
        tdd_require_editor();
        tdd_json(200, ['ok' => true]);
    }
    $stored = tdd_read_catalog();
    tdd_json(200, $stored);
}

if ($method === 'POST') {
    tdd_require_editor();
    $body = tdd_read_json_body();
    $problem = tdd_validate_catalog($body['catalog'] ?? null);
    if ($problem !== null) {
        tdd_json(422, ['error' => 'invalid', 'message' => $problem]);
    }
    $base = $body['baseRevision'] ?? null;
    if (!is_int($base) || $base < 0) {
        tdd_json(400, ['error' => 'bad_revision', 'message' => 'Versão base ausente.']);
    }
    tdd_json(200, tdd_write_catalog($body['catalog'], $base));
}

header('Allow: GET, POST');
tdd_json(405, ['error' => 'method', 'message' => 'Método não permitido.']);
