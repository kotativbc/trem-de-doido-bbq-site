<?php
/**
 * Funções compartilhadas da API do cardápio (PHP 7.4 ou superior).
 * Este arquivo não responde nada sozinho: só funciona incluído por catalog.php e upload.php.
 */
if (!defined('TDD_API')) {
    http_response_code(404);
    exit;
}

ini_set('display_errors', '0');
header('X-Content-Type-Options: nosniff');
header('X-Robots-Tag: noindex, nofollow');
header('Cache-Control: no-store');

const TDD_MAX_BODY_BYTES = 1500000;
const TDD_HISTORY_KEEP = 30;

function tdd_json(int $status, array $payload)
{
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function tdd_data_dir(): string
{
    $dir = __DIR__ . '/data';
    if (!is_dir($dir)) {
        @mkdir($dir, 0755, true);
    }
    // Nada de baixar o arquivo do cardápio ou o histórico direto pelo navegador.
    $guard = $dir . '/.htaccess';
    if (!is_file($guard)) {
        @file_put_contents($guard, "<IfModule mod_authz_core.c>\n  Require all denied\n</IfModule>\n<IfModule !mod_authz_core.c>\n  Order allow,deny\n  Deny from all\n</IfModule>\n");
    }
    return $dir;
}

/** Hash SHA-256 do código secreto do link de edição (definido em config.php). */
function tdd_configured_hash(): ?string
{
    $file = __DIR__ . '/config.php';
    if (!is_file($file)) {
        return null;
    }
    require_once $file;
    if (!defined('TDD_EDITOR_TOKEN_SHA256')) {
        return null;
    }
    $hash = strtolower((string) TDD_EDITOR_TOKEN_SHA256);
    return preg_match('/^[a-f0-9]{64}$/', $hash) === 1 ? $hash : null;
}

/** Interrompe a requisição, a menos que o código secreto enviado no cabeçalho esteja correto. */
function tdd_require_editor(): void
{
    $expected = tdd_configured_hash();
    if ($expected === null) {
        tdd_json(503, ['error' => 'not_configured', 'message' => 'A API ainda não foi configurada (falta api/config.php).']);
    }
    $token = isset($_SERVER['HTTP_X_EDITOR_TOKEN']) ? (string) $_SERVER['HTTP_X_EDITOR_TOKEN'] : '';
    $valid = preg_match('/^[A-Za-z0-9_-]{16,128}$/', $token) === 1
        && hash_equals($expected, hash('sha256', $token));
    if (!$valid) {
        usleep(400000); // desacelera tentativas em sequência
        tdd_json(403, ['error' => 'forbidden', 'message' => 'Acesso negado.']);
    }
}

function tdd_read_json_body(): array
{
    $raw = file_get_contents('php://input');
    if ($raw === false || strlen($raw) > TDD_MAX_BODY_BYTES) {
        tdd_json(413, ['error' => 'too_large', 'message' => 'Dados grandes demais.']);
    }
    $data = json_decode($raw, true);
    if (!is_array($data)) {
        tdd_json(400, ['error' => 'bad_json', 'message' => 'JSON inválido.']);
    }
    return $data;
}

/** @return array{revision:int, updatedAt:?string, catalog:?array} */
function tdd_read_catalog(): array
{
    $file = tdd_data_dir() . '/catalog.json';
    $empty = ['revision' => 0, 'updatedAt' => null, 'catalog' => null];
    if (!is_file($file)) {
        return $empty;
    }
    $data = json_decode((string) file_get_contents($file), true);
    if (!is_array($data) || !isset($data['catalog']) || !is_array($data['catalog'])) {
        return $empty;
    }
    return [
        'revision' => isset($data['revision']) ? (int) $data['revision'] : 0,
        'updatedAt' => isset($data['updatedAt']) ? (string) $data['updatedAt'] : null,
        'catalog' => $data['catalog'],
    ];
}

function tdd_len(string $value): int
{
    return function_exists('mb_strlen') ? mb_strlen($value, 'UTF-8') : strlen($value);
}

function tdd_is_text($value, int $max, int $min = 0): bool
{
    return is_string($value) && tdd_len($value) >= $min && tdd_len($value) <= $max;
}

function tdd_is_id($value): bool
{
    return is_string($value) && preg_match('/^[A-Za-z0-9_-]{1,64}$/', $value) === 1;
}

function tdd_is_image_ref($value): bool
{
    return is_string($value) && strlen($value) <= 500 && preg_match('#^(/|https://)#', $value) === 1;
}

/** Confere a forma do cardápio. Devolve a mensagem do primeiro problema ou null se estiver tudo certo. */
function tdd_validate_catalog($catalog): ?string
{
    if (!is_array($catalog) || !isset($catalog['categories'], $catalog['products'])
        || !is_array($catalog['categories']) || !is_array($catalog['products'])) {
        return 'Formato de cardápio inválido.';
    }
    if (count($catalog['categories']) > 100 || count($catalog['products']) > 1000) {
        return 'Cardápio grande demais.';
    }
    $categoryIds = [];
    foreach ($catalog['categories'] as $c) {
        if (!is_array($c) || !tdd_is_id($c['id'] ?? null) || !tdd_is_text($c['label'] ?? null, 80, 1)
            || !is_bool($c['sundayOnly'] ?? null) || !is_int($c['order'] ?? null) || !is_bool($c['active'] ?? null)) {
            return 'Categoria inválida.';
        }
        $categoryIds[$c['id']] = true;
    }
    $productIds = [];
    foreach ($catalog['products'] as $p) {
        if (!is_array($p) || !tdd_is_id($p['id'] ?? null) || !tdd_is_text($p['name'] ?? null, 120, 1)
            || !tdd_is_text($p['description'] ?? null, 1000)
            || !is_int($p['priceCents'] ?? null) || $p['priceCents'] < 0 || $p['priceCents'] > 10000000
            || !tdd_is_id($p['categoryId'] ?? null) || !isset($categoryIds[$p['categoryId']])) {
            return 'Produto inválido: ' . (is_array($p) && is_string($p['name'] ?? null) ? $p['name'] : '?') . '.';
        }
        foreach (['active', 'soldOut', 'sundayOnly', 'featured'] as $flag) {
            if (!is_bool($p[$flag] ?? null)) {
                return 'Produto inválido (campo ' . $flag . ').';
            }
        }
        if (!is_int($p['order'] ?? null) || !is_array($p['addonGroups'] ?? null) || count($p['addonGroups']) > 20) {
            return 'Produto inválido (ordem ou adicionais).';
        }
        if (isset($p['badge']) && !tdd_is_text($p['badge'], 30)) {
            return 'Selo inválido.';
        }
        if (isset($p['imageKey']) && !tdd_is_id($p['imageKey'])) {
            return 'Imagem inválida.';
        }
        if (isset($p['imageUrl']) && !tdd_is_image_ref($p['imageUrl'])) {
            return 'Endereço de imagem inválido.';
        }
        if (isset($productIds[$p['id']])) {
            return 'Produto repetido.';
        }
        $productIds[$p['id']] = true;
    }
    return null;
}

/**
 * Grava o cardápio com trava de arquivo e controle de versão.
 * @return array{revision:int, updatedAt:string}
 */
function tdd_write_catalog(array $catalog, int $baseRevision): array
{
    $dir = tdd_data_dir();
    $lock = @fopen($dir . '/.lock', 'c');
    if ($lock === false || !flock($lock, LOCK_EX)) {
        tdd_json(500, ['error' => 'lock', 'message' => 'Não foi possível gravar agora. Tente de novo.']);
    }

    $current = tdd_read_catalog();
    if ($current['revision'] !== $baseRevision) {
        flock($lock, LOCK_UN);
        fclose($lock);
        tdd_json(409, ['error' => 'conflict', 'message' => 'O cardápio foi alterado em outro aparelho. Recarregue a página e tente de novo.']);
    }

    // Cópia da versão anterior, para poder voltar atrás se algo for apagado sem querer.
    $file = $dir . '/catalog.json';
    if (is_file($file)) {
        $historyDir = $dir . '/history';
        if (!is_dir($historyDir)) {
            @mkdir($historyDir, 0755, true);
        }
        @copy($file, sprintf('%s/catalog-%06d.json', $historyDir, $current['revision']));
        $old = glob($historyDir . '/catalog-*.json') ?: [];
        sort($old);
        foreach (array_slice($old, 0, max(0, count($old) - TDD_HISTORY_KEEP)) as $stale) {
            @unlink($stale);
        }
    }

    $next = $current['revision'] + 1;
    $updatedAt = gmdate('c');
    $payload = json_encode(
        ['revision' => $next, 'updatedAt' => $updatedAt, 'catalog' => $catalog],
        JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT
    );
    $tmp = $file . '.tmp' . bin2hex(random_bytes(4));
    $ok = $payload !== false && file_put_contents($tmp, $payload) !== false && rename($tmp, $file);
    if (!$ok) {
        @unlink($tmp);
    }
    flock($lock, LOCK_UN);
    fclose($lock);

    if (!$ok) {
        tdd_json(500, ['error' => 'write', 'message' => 'Não foi possível salvar. Verifique a permissão de escrita da pasta api/data.']);
    }
    return ['revision' => $next, 'updatedAt' => $updatedAt];
}
