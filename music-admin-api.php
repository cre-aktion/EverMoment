<?php
declare(strict_types=1);

require_once __DIR__ . '/includes/config.php';
require_once __DIR__ . '/includes/id3.php';
require_once __DIR__ . '/includes/music-revision.php';

session_name('evermoment_admin');
session_set_cookie_params([
    'httponly' => true,
    'samesite' => 'Strict',
    'secure' => !empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off',
]);
session_start();

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');

function musicOut(array $data, int $status = 200): never {
    http_response_code($status);
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function musicBody(): array {
    $raw = file_get_contents('php://input');
    $data = json_decode($raw ?: '{}', true);
    return is_array($data) ? $data : [];
}

function musicRequireLogin(): void {
    if (empty($_SESSION['em_admin'])) {
        musicOut(['ok' => false, 'error' => 'Nicht angemeldet.'], 401);
    }
}

function musicRequireCsrf(string $token): void {
    musicRequireLogin();
    $sessionToken = (string)($_SESSION['em_csrf'] ?? '');
    if ($sessionToken === '' || !hash_equals($sessionToken, $token)) {
        musicOut(['ok' => false, 'error' => 'Ungültiges Sicherheitstoken.'], 403);
    }
}

function musicRoot(): string {
    $root = __DIR__ . '/public/music';
    if (!is_dir($root) && !mkdir($root, 0775, true) && !is_dir($root)) {
        musicOut(['ok' => false, 'error' => 'Der Musikordner konnte nicht erstellt werden.'], 500);
    }
    return $root;
}

function musicStorageRoot(): string {
    $root = __DIR__ . '/storage';
    if (!is_dir($root) && !mkdir($root, 0775, true) && !is_dir($root)) {
        musicOut(['ok' => false, 'error' => 'Der Storage-Ordner konnte nicht erstellt werden.'], 500);
    }
    return $root;
}

function musicLock() {
    $file = musicStorageRoot() . '/music-admin.lock';
    $handle = fopen($file, 'c+');
    if ($handle === false || !flock($handle, LOCK_EX)) {
        musicOut(['ok' => false, 'error' => 'Musikverwaltung ist vorübergehend gesperrt.'], 503);
    }
    return $handle;
}

function musicUnlock($handle): void {
    if (is_resource($handle)) {
        flock($handle, LOCK_UN);
        fclose($handle);
    }
}

function musicFiles(): array {
    $root = musicRoot();
    $files = glob($root . '/*.mp3') ?: [];
    usort($files, static function (string $a, string $b): int {
        $aName = basename($a);
        $bName = basename($b);
        preg_match('/^(\d+)/', $aName, $am);
        preg_match('/^(\d+)/', $bName, $bm);
        $aNum = isset($am[1]) ? (int)$am[1] : PHP_INT_MAX;
        $bNum = isset($bm[1]) ? (int)$bm[1] : PHP_INT_MAX;
        return $aNum !== $bNum ? $aNum <=> $bNum : strnatcasecmp($aName, $bName);
    });
    return $files;
}

function musicWidth(int $count): int {
    return max(3, strlen((string)max(1, $count)));
}

function musicFinalName(int $position, int $count): string {
    return str_pad((string)$position, musicWidth($count), '0', STR_PAD_LEFT) . '.mp3';
}

function musicNormalizeOrder(array $orderedPaths): array {
    $root = musicRoot();
    $count = count($orderedPaths);
    if ($count === 0) return [];

    $token = bin2hex(random_bytes(8));
    $temporary = [];

    foreach ($orderedPaths as $index => $source) {
        if (!is_file($source)) {
            throw new RuntimeException('Ein Musiktitel wurde während der Sortierung nicht gefunden.');
        }
        $temp = $root . '/.__em_' . $token . '_' . $index . '.tmp';
        if (!rename($source, $temp)) {
            throw new RuntimeException('Temporäre Umbenennung fehlgeschlagen.');
        }
        $temporary[] = $temp;
    }

    $finalPaths = [];
    foreach ($temporary as $index => $temp) {
        $name = musicFinalName($index + 1, $count);
        $target = $root . '/' . $name;
        if (!rename($temp, $target)) {
            throw new RuntimeException('Die Playlist konnte nicht neu nummeriert werden.');
        }
        $finalPaths[] = $target;
    }

    clearstatcache();
    return $finalPaths;
}

function musicIniBytes(string $value): int {
    $value = trim($value);
    if ($value === '') return 0;
    $last = strtolower(substr($value, -1));
    $number = (float)$value;
    return match ($last) {
        'g' => (int)round($number * 1024 * 1024 * 1024),
        'm' => (int)round($number * 1024 * 1024),
        'k' => (int)round($number * 1024),
        default => (int)$number,
    };
}

function musicServerLimit(): int {
    $upload = musicIniBytes((string)ini_get('upload_max_filesize'));
    $post = musicIniBytes((string)ini_get('post_max_size'));
    if ($upload <= 0) return $post;
    if ($post <= 0) return $upload;
    return min($upload, $post);
}

function musicValidateUpload(array $file): void {
    if (($file['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_OK) {
        $code = (int)($file['error'] ?? UPLOAD_ERR_NO_FILE);
        $message = match ($code) {
            UPLOAD_ERR_INI_SIZE, UPLOAD_ERR_FORM_SIZE => 'Die MP3 überschreitet das Serverlimit.',
            UPLOAD_ERR_PARTIAL => 'Die MP3 wurde nur teilweise übertragen.',
            UPLOAD_ERR_NO_FILE => 'Keine MP3 empfangen.',
            default => 'Uploadfehler ' . $code . '.',
        };
        musicOut(['ok' => false, 'error' => $message], 400);
    }

    $tmp = (string)($file['tmp_name'] ?? '');
    if ($tmp === '' || !is_uploaded_file($tmp)) {
        musicOut(['ok' => false, 'error' => 'Ungültiger Upload.'], 400);
    }

    $name = (string)($file['name'] ?? '');
    if (strtolower(pathinfo($name, PATHINFO_EXTENSION)) !== 'mp3') {
        musicOut(['ok' => false, 'error' => 'Es sind ausschließlich MP3-Dateien erlaubt.'], 415);
    }

    $mime = (new finfo(FILEINFO_MIME_TYPE))->file($tmp) ?: '';
    $allowedMimes = [
        'audio/mpeg',
        'audio/mp3',
        'audio/x-mpeg',
        'audio/mpeg3',
        'audio/x-mpeg-3',
        'application/octet-stream',
    ];
    if (!in_array(strtolower($mime), $allowedMimes, true)) {
        musicOut(['ok' => false, 'error' => 'Die Datei wurde nicht als MP3 erkannt (' . $mime . ').'], 415);
    }

    $serverLimit = musicServerLimit();
    if ($serverLimit > 0 && (int)$file['size'] > $serverLimit) {
        musicOut(['ok' => false, 'error' => 'Die MP3 überschreitet das PHP-Serverlimit.'], 413);
    }
}

function musicPublicItem(string $path, ?string $revision = null): array {
    $name = basename($path);
    $tags = readMp3Id3($path, true);
    $mtime = filemtime($path) ?: time();
    $revision ??= emMusicRevision();

    return [
        'name' => $name,
        'title' => $tags['title'],
        'artist' => $tags['artist'],
        'cover' => $tags['cover'] !== null
            ? emVersionedMusicUrl('music-cover.php?file=' . rawurlencode($name), $revision, $mtime)
            : null,
        'url' => emVersionedMusicUrl('public/music/' . rawurlencode($name), $revision, $mtime),
        'size' => filesize($path) ?: 0,
        'mtime' => $mtime,
    ];
}

function musicListResponse(?string $revision = null): array {
    $revision ??= emMusicRevision();
    return array_map(
        static fn(string $path): array => musicPublicItem($path, $revision),
        musicFiles()
    );
}

$action = (string)($_GET['action'] ?? 'list');
musicRequireLogin();

if ($action === 'list') {
    musicOut([
        'ok' => true,
        'revision' => emMusicRevision(),
        'tracks' => musicListResponse(),
        'limits' => [
            'uploadMax' => (string)ini_get('upload_max_filesize'),
            'postMax' => (string)ini_get('post_max_size'),
            'effectiveBytes' => musicServerLimit(),
        ],
    ]);
}

if ($action === 'upload') {
    musicRequireCsrf((string)($_POST['csrf'] ?? ''));

    $files = $_FILES['tracks'] ?? null;
    if (!is_array($files) || !isset($files['name'])) {
        musicOut(['ok' => false, 'error' => 'Keine MP3-Dateien empfangen.'], 400);
    }

    $names = is_array($files['name']) ? $files['name'] : [$files['name']];
    $tmpNames = is_array($files['tmp_name']) ? $files['tmp_name'] : [$files['tmp_name']];
    $errors = is_array($files['error']) ? $files['error'] : [$files['error']];
    $sizes = is_array($files['size']) ? $files['size'] : [$files['size']];

    $normalized = [];
    foreach ($names as $index => $name) {
        $file = [
            'name' => $name,
            'tmp_name' => $tmpNames[$index] ?? '',
            'error' => $errors[$index] ?? UPLOAD_ERR_NO_FILE,
            'size' => $sizes[$index] ?? 0,
        ];
        musicValidateUpload($file);
        $normalized[] = $file;
    }

    $lock = musicLock();
    try {
        $existing = musicFiles();
        $total = count($existing) + count($normalized);
        $position = count($existing) + 1;

        foreach ($normalized as $file) {
            $name = musicFinalName($position, $total);
            $target = musicRoot() . '/' . $name;
            if (!move_uploaded_file($file['tmp_name'], $target)) {
                throw new RuntimeException('Eine MP3 konnte nicht gespeichert werden.');
            }
            @chmod($target, 0664);
            $position++;
        }

        musicNormalizeOrder(musicFiles());
    } catch (Throwable $e) {
        musicUnlock($lock);
        musicOut(['ok' => false, 'error' => $e->getMessage()], 500);
    }
    musicUnlock($lock);
    $revision = emBumpMusicRevision();

    musicOut([
        'ok' => true,
        'revision' => $revision,
        'tracks' => musicListResponse($revision)
    ]);
}

if ($action === 'replace') {
    musicRequireCsrf((string)($_POST['csrf'] ?? ''));
    $name = basename((string)($_POST['name'] ?? ''));
    if (!preg_match('/^\d+\.mp3$/', $name)) {
        musicOut(['ok' => false, 'error' => 'Ungültiger Titel.'], 422);
    }

    $file = $_FILES['track'] ?? [];
    musicValidateUpload(is_array($file) ? $file : []);

    $target = musicRoot() . '/' . $name;
    if (!is_file($target)) {
        musicOut(['ok' => false, 'error' => 'Der Titel wurde nicht gefunden.'], 404);
    }

    $lock = musicLock();
    try {
        $temporary = musicRoot() . '/.__replace_' . bin2hex(random_bytes(8)) . '.mp3';
        if (!move_uploaded_file((string)$file['tmp_name'], $temporary)) {
            throw new RuntimeException('Die Ersatzdatei konnte nicht gespeichert werden.');
        }
        @chmod($temporary, 0664);
        if (!rename($temporary, $target)) {
            @unlink($temporary);
            throw new RuntimeException('Der Titel konnte nicht ersetzt werden.');
        }
        clearstatcache(true, $target);
    } catch (Throwable $e) {
        musicUnlock($lock);
        musicOut(['ok' => false, 'error' => $e->getMessage()], 500);
    }
    musicUnlock($lock);
    $revision = emBumpMusicRevision();

    musicOut([
        'ok' => true,
        'revision' => $revision,
        'tracks' => musicListResponse($revision)
    ]);
}

if ($action === 'delete') {
    $body = musicBody();
    musicRequireCsrf((string)($body['csrf'] ?? ''));
    $name = basename((string)($body['name'] ?? ''));
    if (!preg_match('/^\d+\.mp3$/', $name)) {
        musicOut(['ok' => false, 'error' => 'Ungültiger Titel.'], 422);
    }

    $lock = musicLock();
    try {
        $target = musicRoot() . '/' . $name;
        if (!is_file($target)) {
            throw new RuntimeException('Der Titel wurde nicht gefunden.');
        }
        if (!unlink($target)) {
            throw new RuntimeException('Der Titel konnte nicht gelöscht werden.');
        }
        musicNormalizeOrder(musicFiles());
    } catch (Throwable $e) {
        musicUnlock($lock);
        musicOut(['ok' => false, 'error' => $e->getMessage()], 500);
    }
    musicUnlock($lock);
    $revision = emBumpMusicRevision();

    musicOut([
        'ok' => true,
        'revision' => $revision,
        'tracks' => musicListResponse($revision)
    ]);
}

if ($action === 'reorder') {
    $body = musicBody();
    musicRequireCsrf((string)($body['csrf'] ?? ''));
    $order = array_values(array_filter((array)($body['order'] ?? []), 'is_string'));
    $current = array_map('basename', musicFiles());

    if (count($order) !== count($current) || array_diff($order, $current) || array_diff($current, $order)) {
        musicOut(['ok' => false, 'error' => 'Die Playlist hat sich zwischenzeitlich geändert. Bitte neu laden.'], 409);
    }

    $lock = musicLock();
    try {
        $paths = array_map(static fn(string $name): string => musicRoot() . '/' . basename($name), $order);
        musicNormalizeOrder($paths);
    } catch (Throwable $e) {
        musicUnlock($lock);
        musicOut(['ok' => false, 'error' => $e->getMessage()], 500);
    }
    musicUnlock($lock);
    $revision = emBumpMusicRevision();

    musicOut([
        'ok' => true,
        'revision' => $revision,
        'tracks' => musicListResponse($revision)
    ]);
}

musicOut(['ok' => false, 'error' => 'Unbekannte Aktion.'], 404);
