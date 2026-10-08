<?php
/**
 * Envio de foto de produto (exige X-Editor-Token). Guarda em /uploads com nome aleatório.
 *   POST upload.php  (multipart, campo "image") -> { "url": "/uploads/abc123.jpg" }
 */
define('TDD_API', true);
require __DIR__ . '/_common.php';

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    header('Allow: POST');
    tdd_json(405, ['error' => 'method', 'message' => 'Método não permitido.']);
}
tdd_require_editor();

$file = $_FILES['image'] ?? null;
if (!is_array($file) || ($file['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_OK || !is_uploaded_file($file['tmp_name'])) {
    tdd_json(400, ['error' => 'no_file', 'message' => 'Nenhuma imagem recebida.']);
}
if ($file['size'] > 4 * 1024 * 1024) {
    tdd_json(413, ['error' => 'too_large', 'message' => 'A imagem passa de 4 MB.']);
}

// O tipo vem do conteúdo do arquivo, nunca do nome ou do tipo informado pelo navegador.
$info = @getimagesize($file['tmp_name']);
$types = [IMAGETYPE_JPEG => 'jpg', IMAGETYPE_PNG => 'png', IMAGETYPE_WEBP => 'webp'];
if ($info === false || !isset($types[$info[2]])) {
    tdd_json(415, ['error' => 'bad_type', 'message' => 'Use uma imagem JPG, PNG ou WebP.']);
}
if ($info[0] > 4000 || $info[1] > 4000) {
    tdd_json(413, ['error' => 'too_big_dimensions', 'message' => 'A imagem passa de 4000 px de lado.']);
}

$dir = dirname(__DIR__) . '/uploads';
if (!is_dir($dir)) {
    @mkdir($dir, 0755, true);
}
// Pasta de imagens: nunca executa scripts e não lista arquivos.
$guard = $dir . '/.htaccess';
if (!is_file($guard)) {
    @file_put_contents(
        $guard,
        "<FilesMatch \"\\.(php|phtml|phar|pl|py|cgi|sh)$\">\n  <IfModule mod_authz_core.c>\n    Require all denied\n  </IfModule>\n  <IfModule !mod_authz_core.c>\n    Order allow,deny\n    Deny from all\n  </IfModule>\n</FilesMatch>\n"
    );
    // Sem este arquivo vazio, alguns servidores listariam as fotos da pasta.
    @file_put_contents($dir . '/index.html', '');
}

$name = bin2hex(random_bytes(12)) . '.' . $types[$info[2]];
if (!@move_uploaded_file($file['tmp_name'], $dir . '/' . $name)) {
    tdd_json(500, ['error' => 'write', 'message' => 'Não foi possível salvar a imagem. Verifique a permissão da pasta uploads.']);
}
@chmod($dir . '/' . $name, 0644);

$base = rtrim(str_replace('\\', '/', dirname(dirname($_SERVER['SCRIPT_NAME'] ?? '/api/upload.php'))), '/');
tdd_json(200, ['url' => $base . '/uploads/' . $name]);
