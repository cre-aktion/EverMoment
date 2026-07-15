<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

require_once __DIR__ . '/includes/id3.php';
require_once __DIR__ . '/includes/media-revision.php';
require_once __DIR__ . '/includes/music-revision.php';

$base = __DIR__;
$mediaRoot = $base . '/public/img';
$musicRoot = $base . '/public/music';
$mediaRevision = emMediaRevision();
$musicRevision = emMusicRevision();

function collectFiles(string $root, array $extensions, string $urlPrefix, ?string $revision = null): array {
    if (!is_dir($root)) return [];

    $items = [];
    $iterator = new RecursiveIteratorIterator(
        new RecursiveDirectoryIterator($root, FilesystemIterator::SKIP_DOTS)
    );

    foreach ($iterator as $file) {
        if (!$file->isFile()) continue;
        $ext = strtolower($file->getExtension());
        if (!in_array($ext, $extensions, true)) continue;

        $absolute = $file->getPathname();
        $relative = ltrim(str_replace('\\', '/', substr($absolute, strlen($root))), '/');
        $items[] = [
            'name' => $file->getFilename(),
            'relative' => $relative,
            'absolute' => $absolute,
            'mtime' => $file->getMTime(),
            'url' => $revision === null
                ? $urlPrefix . '/' . implode('/', array_map('rawurlencode', explode('/', $relative)))
                : emVersionedMediaUrl(
                    $urlPrefix . '/' . implode('/', array_map('rawurlencode', explode('/', $relative))),
                    $revision,
                    $file->getMTime()
                ),
            'ext' => $ext,
        ];
    }

    usort($items, static function(array $a, array $b): int {
        $aBase = pathinfo($a['name'], PATHINFO_FILENAME);
        $bBase = pathinfo($b['name'], PATHINFO_FILENAME);
        preg_match('/^(\d+)/', $aBase, $am);
        preg_match('/^(\d+)/', $bBase, $bm);
        $aNum = isset($am[1]) ? (int)$am[1] : PHP_INT_MAX;
        $bNum = isset($bm[1]) ? (int)$bm[1] : PHP_INT_MAX;
        return $aNum !== $bNum ? $aNum <=> $bNum : strnatcasecmp($a['relative'], $b['relative']);
    });

    return $items;
}

$imageExt = ['jpg','jpeg','png','webp','gif','avif'];
$videoExt = ['mp4','webm','mov','m4v','ogv'];
$musicExt = ['mp3','m4a','aac','ogg','wav'];

$media = collectFiles($mediaRoot, array_merge($imageExt, $videoExt), 'public/img', $mediaRevision);
foreach ($media as &$item) {
    $item['type'] = in_array($item['ext'], $videoExt, true) ? 'video' : 'image';
    unset($item['absolute'], $item['mtime']);
}
unset($item);

$music = collectFiles($musicRoot, $musicExt, 'public/music', $musicRevision);
foreach ($music as &$track) {
    $track['title'] = null;
    $track['artist'] = null;
    $track['cover'] = null;

    if ($track['ext'] === 'mp3') {
        $tags = readMp3Id3($track['absolute'], true);
        $track['title'] = $tags['title'];
        $track['artist'] = $tags['artist'];
        if ($tags['cover'] !== null) {
            $track['cover'] = emVersionedMusicUrl(
                'music-cover.php?file=' . rawurlencode($track['relative']),
                $musicRevision,
                $track['mtime']
            );
        }
    }

    unset($track['absolute'], $track['mtime']);
}
unset($track);

echo json_encode([
    'ok' => true,
    'media' => $media,
    'music' => $music,
], JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
