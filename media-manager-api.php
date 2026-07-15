<?php
declare(strict_types=1);

require_once __DIR__ . '/includes/config.php';
require_once __DIR__ . '/includes/media-revision.php';

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

function mmOut(array $data, int $status = 200): never {
    http_response_code($status);
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function mmRequireLogin(): void {
    if (empty($_SESSION['em_admin'])) {
        mmOut(['ok' => false, 'error' => 'Nicht angemeldet.'], 401);
    }
}

function mmBody(): array {
    $raw = file_get_contents('php://input');
    $data = json_decode($raw ?: '{}', true);
    return is_array($data) ? $data : [];
}

function mmRequireCsrf(string $token): void {
    mmRequireLogin();
    $sessionToken = (string)($_SESSION['em_csrf'] ?? '');
    if ($sessionToken === '' || !hash_equals($sessionToken, $token)) {
        mmOut(['ok' => false, 'error' => 'Ungültiges Sicherheitstoken.'], 403);
    }
}

function mmRoot(): string {
    $root = __DIR__ . '/public/img';
    if (!is_dir($root)) {
        mmOut(['ok' => false, 'error' => 'Medienordner public/img wurde nicht gefunden.'], 500);
    }
    return $root;
}

function mmStorage(): string {
    $storage = emStorageDir();
    if (!is_dir($storage) && !mkdir($storage, 0775, true) && !is_dir($storage)) {
        mmOut(['ok' => false, 'error' => 'Storage-Ordner ist nicht verfügbar.'], 500);
    }
    return $storage;
}

function mmLock() {
    $handle = fopen(mmStorage() . '/upload.lock', 'c+');
    if ($handle === false || !flock($handle, LOCK_EX)) {
        mmOut(['ok' => false, 'error' => 'Medienordner ist vorübergehend gesperrt.'], 503);
    }
    return $handle;
}

function mmUnlock($handle): void {
    if (is_resource($handle)) {
        flock($handle, LOCK_UN);
        fclose($handle);
    }
}

function mmAllowedExtensions(): array {
    return [
        'jpg' => 'image',
        'jpeg' => 'image',
        'png' => 'image',
        'webp' => 'image',
        'gif' => 'image',
        'avif' => 'image',
        'mp4' => 'video',
        'webm' => 'video',
        'mov' => 'video',
        'm4v' => 'video',
        'ogv' => 'video',
    ];
}

function mmFiles(): array {
    $root = mmRoot();
    $allowed = mmAllowedExtensions();
    $items = [];

    foreach (new DirectoryIterator($root) as $file) {
        if (!$file->isFile()) continue;
        $ext = strtolower($file->getExtension());
        if (!isset($allowed[$ext])) continue;

        $name = $file->getFilename();
        preg_match('/^(\d+)/', pathinfo($name, PATHINFO_FILENAME), $match);
        $number = isset($match[1]) ? (int)$match[1] : PHP_INT_MAX;

        $items[] = [
            'id' => $name,
            'name' => $name,
            'path' => $file->getPathname(),
            'ext' => $ext,
            'type' => $allowed[$ext],
            'number' => $number,
            'size' => $file->getSize(),
            'mtime' => $file->getMTime(),
        ];
    }

    usort($items, static function (array $a, array $b): int {
        return $a['number'] !== $b['number']
            ? $a['number'] <=> $b['number']
            : strnatcasecmp($a['name'], $b['name']);
    });

    return $items;
}

function mmStartNumber(array $items): int {
    foreach ($items as $item) {
        if ((int)$item['number'] === 0) {
            return 0;
        }
    }
    return 1;
}

function mmSignature(array $items): string {
    $parts = array_map(
        static fn(array $item): string => $item['name'] . '|' . $item['size'] . '|' . $item['mtime'],
        $items
    );
    return hash('sha256', implode("\n", $parts));
}

function mmPublicItems(array $items, ?string $revision = null): array {
    $revision ??= emMediaRevision();
    $result = [];
    foreach ($items as $index => $item) {
        $url = emVersionedMediaUrl(
            'public/img/' . rawurlencode($item['name']),
            $revision,
            (int)$item['mtime']
        );
        $result[] = [
            'id' => $item['id'],
            'name' => $item['name'],
            'type' => $item['type'],
            'ext' => $item['ext'],
            'size' => $item['size'],
            'mtime' => $item['mtime'],
            'url' => $url,
            'position' => $index + 1,
        ];
    }
    return $result;
}

function mmWidth(int $highestNumber): int {
    return max(3, strlen((string)max(0, $highestNumber)));
}

function mmRenumber(array $orderedItems): array {
    if ($orderedItems === []) return [];

    $root = mmRoot();
    $count = count($orderedItems);
    $start = mmStartNumber($orderedItems);
    $highest = $start + $count - 1;
    $width = mmWidth($highest);
    $token = bin2hex(random_bytes(8));
    $temporary = [];

    foreach ($orderedItems as $index => $item) {
        $source = $item['path'];
        if (!is_file($source)) {
            throw new RuntimeException('Eine Mediendatei wurde während der Änderung nicht gefunden.');
        }

        $temporaryPath = $root . '/.__evermoment_' . $token . '_' . $index . '.tmp';
        if (!rename($source, $temporaryPath)) {
            throw new RuntimeException('Temporäre Umbenennung fehlgeschlagen.');
        }

        $temporary[] = [
            'path' => $temporaryPath,
            'ext' => $item['ext'],
            'type' => $item['type'],
        ];
    }

    $result = [];

    foreach ($temporary as $index => $item) {
        $number = $start + $index;
        $name = str_pad((string)$number, $width, '0', STR_PAD_LEFT) . '.' . $item['ext'];
        $target = $root . '/' . $name;

        if (!rename($item['path'], $target)) {
            throw new RuntimeException('Die Medien konnten nicht vollständig neu nummeriert werden.');
        }
        @chmod($target, 0664);
        clearstatcache(true, $target);

        $result[] = [
            'id' => $name,
            'name' => $name,
            'path' => $target,
            'ext' => $item['ext'],
            'type' => $item['type'],
            'number' => $number,
            'size' => filesize($target) ?: 0,
            'mtime' => filemtime($target) ?: time(),
        ];
    }

    return $result;
}

function mmFindOrderedItems(array $names, array $current): array {
    $map = [];
    foreach ($current as $item) {
        $map[$item['name']] = $item;
    }

    $ordered = [];
    foreach ($names as $name) {
        $name = basename((string)$name);
        if (!isset($map[$name])) {
            throw new RuntimeException('Die Medienliste hat sich zwischenzeitlich geändert.');
        }
        $ordered[] = $map[$name];
        unset($map[$name]);
    }

    if ($map !== []) {
        throw new RuntimeException('Die Medienliste ist unvollständig. Bitte neu laden.');
    }

    return $ordered;
}

$action = (string)($_GET['action'] ?? 'list');
mmRequireLogin();

if ($action === 'list') {
    if (empty($_SESSION['em_csrf'])) {
        $_SESSION['em_csrf'] = bin2hex(random_bytes(24));
    }
    $items = mmFiles();
    mmOut([
        'ok' => true,
        'csrf' => $_SESSION['em_csrf'],
        'signature' => mmSignature($items),
        'revision' => emMediaRevision(),
        'items' => mmPublicItems($items),
        'counts' => [
            'all' => count($items),
            'images' => count(array_filter($items, static fn(array $item): bool => $item['type'] === 'image')),
            'videos' => count(array_filter($items, static fn(array $item): bool => $item['type'] === 'video')),
        ],
    ]);
}

$body = mmBody();
mmRequireCsrf((string)($body['csrf'] ?? ''));

if ($action === 'reorder') {
    $order = array_values(array_filter((array)($body['order'] ?? []), 'is_string'));
    $clientSignature = (string)($body['signature'] ?? '');

    $lock = mmLock();
    try {
        $current = mmFiles();
        if (!hash_equals(mmSignature($current), $clientSignature)) {
            throw new DomainException('Die Medienliste wurde inzwischen verändert, zum Beispiel durch einen Gast-Upload. Bitte neu laden.');
        }
        if (count($order) !== count($current)) {
            throw new DomainException('Die neue Reihenfolge ist unvollständig.');
        }

        $ordered = mmFindOrderedItems($order, $current);
        $items = mmRenumber($ordered);
    } catch (DomainException $e) {
        mmUnlock($lock);
        mmOut(['ok' => false, 'error' => $e->getMessage(), 'reload' => true], 409);
    } catch (Throwable $e) {
        mmUnlock($lock);
        mmOut(['ok' => false, 'error' => $e->getMessage()], 500);
    }
    mmUnlock($lock);
    $revision = emBumpMediaRevision();

    mmOut([
        'ok' => true,
        'signature' => mmSignature($items),
        'revision' => $revision,
        'items' => mmPublicItems($items, $revision),
    ]);
}

if ($action === 'delete') {
    $name = basename((string)($body['name'] ?? ''));
    $clientSignature = (string)($body['signature'] ?? '');

    $lock = mmLock();
    try {
        $current = mmFiles();
        if (!hash_equals(mmSignature($current), $clientSignature)) {
            throw new DomainException('Die Medienliste wurde inzwischen verändert. Bitte neu laden.');
        }

        $target = null;
        foreach ($current as $item) {
            if ($item['name'] === $name) {
                $target = $item;
                break;
            }
        }
        if ($target === null) {
            throw new DomainException('Das Medium wurde nicht gefunden.');
        }

        if (!unlink($target['path'])) {
            throw new RuntimeException('Die Datei konnte nicht gelöscht werden.');
        }

        $remaining = array_values(array_filter(
            $current,
            static fn(array $item): bool => $item['name'] !== $name
        ));

        $items = mmRenumber($remaining);
    } catch (DomainException $e) {
        mmUnlock($lock);
        mmOut(['ok' => false, 'error' => $e->getMessage(), 'reload' => true], 409);
    } catch (Throwable $e) {
        mmUnlock($lock);
        mmOut(['ok' => false, 'error' => $e->getMessage()], 500);
    }
    mmUnlock($lock);
    $revision = emBumpMediaRevision();

    mmOut([
        'ok' => true,
        'signature' => mmSignature($items),
        'revision' => $revision,
        'items' => mmPublicItems($items, $revision),
    ]);
}


if ($action === 'delete-many') {
    $names = array_values(array_unique(array_map(
        static fn(mixed $name): string => basename((string)$name),
        (array)($body['names'] ?? [])
    )));
    $clientSignature = (string)($body['signature'] ?? '');

    if ($names === []) {
        mmOut(['ok' => false, 'error' => 'Keine Medien ausgewählt.'], 422);
    }

    $lock = mmLock();
    try {
        $current = mmFiles();
        if (!hash_equals(mmSignature($current), $clientSignature)) {
            throw new DomainException('Die Medienliste wurde inzwischen verändert. Bitte neu laden.');
        }

        $available = array_column($current, null, 'name');
        foreach ($names as $name) {
            if (!isset($available[$name])) {
                throw new DomainException('Mindestens ein ausgewähltes Medium wurde nicht gefunden.');
            }
        }

        foreach ($names as $name) {
            if (!unlink($available[$name]['path'])) {
                throw new RuntimeException('Mindestens eine Datei konnte nicht gelöscht werden.');
            }
        }

        $remaining = array_values(array_filter(
            $current,
            static fn(array $item): bool => !in_array($item['name'], $names, true)
        ));

        $items = mmRenumber($remaining);
    } catch (DomainException $e) {
        mmUnlock($lock);
        mmOut(['ok' => false, 'error' => $e->getMessage(), 'reload' => true], 409);
    } catch (Throwable $e) {
        mmUnlock($lock);
        mmOut(['ok' => false, 'error' => $e->getMessage()], 500);
    }
    mmUnlock($lock);
    $revision = emBumpMediaRevision();

    mmOut([
        'ok' => true,
        'signature' => mmSignature($items),
        'revision' => $revision,
        'items' => mmPublicItems($items, $revision),
    ]);
}

mmOut(['ok' => false, 'error' => 'Unbekannte Aktion.'], 404);
