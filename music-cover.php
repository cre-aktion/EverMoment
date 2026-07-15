<?php
declare(strict_types=1);

require_once __DIR__ . '/includes/id3.php';

$musicRoot = realpath(__DIR__ . '/public/music');
$relative = isset($_GET['file']) ? str_replace('\\', '/', (string)$_GET['file']) : '';

if ($musicRoot === false || $relative === '' || str_contains($relative, "\0") || str_contains($relative, '../')) {
    http_response_code(404);
    exit;
}

$requested = realpath($musicRoot . DIRECTORY_SEPARATOR . $relative);
$rootPrefix = rtrim(str_replace('\\', '/', $musicRoot), '/') . '/';
$requestedNormalized = $requested !== false ? str_replace('\\', '/', $requested) : '';

if (
    $requested === false ||
    !str_starts_with($requestedNormalized, $rootPrefix) ||
    strtolower(pathinfo($requested, PATHINFO_EXTENSION)) !== 'mp3' ||
    !is_file($requested)
) {
    http_response_code(404);
    exit;
}

$tags = readMp3Id3($requested, true);
if ($tags['cover'] === null) {
    http_response_code(404);
    exit;
}

$mtime = filemtime($requested) ?: time();
$etag = '"' . sha1($requestedNormalized . '|' . $mtime . '|' . strlen($tags['cover']['data'])) . '"';

header('Content-Type: ' . $tags['cover']['mime']);
header('Content-Length: ' . strlen($tags['cover']['data']));
header('Cache-Control: no-cache, must-revalidate');
header('Last-Modified: ' . gmdate('D, d M Y H:i:s', $mtime) . ' GMT');
header('ETag: ' . $etag);
header('X-Content-Type-Options: nosniff');

echo $tags['cover']['data'];
