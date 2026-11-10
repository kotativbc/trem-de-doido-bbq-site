<?php
/**
 * API dos dias e horários de funcionamento.
 *   GET  schedule.php  -> horários salvos (público, é o que o site exibe)
 *   POST schedule.php  -> salva os horários (exige X-Editor-Token)
 */
define('TDD_API', true);
require __DIR__ . '/_common.php';

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

if ($method === 'GET') {
    tdd_json(200, tdd_read_schedule());
}

if ($method === 'POST') {
    tdd_require_editor();
    $body = tdd_read_json_body();
    $problem = tdd_validate_schedule($body['schedule'] ?? null);
    if ($problem !== null) {
        tdd_json(422, ['error' => 'invalid', 'message' => $problem]);
    }
    // Guarda só os campos conhecidos, na ordem certa.
    $clean = ['hours' => [], 'closedDates' => array_values($body['schedule']['closedDates'])];
    foreach ($body['schedule']['hours'] as $day) {
        $clean['hours'][] = ['open' => $day['open'], 'from' => $day['from'], 'to' => $day['to']];
    }
    sort($clean['closedDates']);
    tdd_json(200, tdd_write_schedule($clean));
}

header('Allow: GET, POST');
tdd_json(405, ['error' => 'method', 'message' => 'Método não permitido.']);
