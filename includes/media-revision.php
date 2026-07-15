<?php
declare(strict_types=1);

function emMediaRevisionFile(): string {
    $storage = __DIR__ . '/../storage';
    if (!is_dir($storage) && !mkdir($storage, 0775, true) && !is_dir($storage)) {
        throw new RuntimeException('Storage-Ordner konnte nicht erstellt werden.');
    }
    return $storage . '/media-revision.txt';
}

function emMediaRevision(): string {
    $file = emMediaRevisionFile();
    if (!is_file($file)) {
        $initial = (string)max(1, time());
        if (file_put_contents($file, $initial, LOCK_EX) === false) {
            throw new RuntimeException('Medienrevision konnte nicht initialisiert werden.');
        }
        @chmod($file, 0664);
        return $initial;
    }

    $value = trim((string)file_get_contents($file));
    return preg_match('/^\d+$/', $value) ? $value : (string)max(1, time());
}

function emBumpMediaRevision(): string {
    $file = emMediaRevisionFile();
    $handle = fopen($file, 'c+');
    if ($handle === false) {
        throw new RuntimeException('Medienrevision konnte nicht geöffnet werden.');
    }

    try {
        if (!flock($handle, LOCK_EX)) {
            throw new RuntimeException('Medienrevision konnte nicht gesperrt werden.');
        }

        rewind($handle);
        $current = trim((string)stream_get_contents($handle));
        $currentNumber = preg_match('/^\d+$/', $current) ? (int)$current : time();
        $next = (string)max($currentNumber + 1, time());

        ftruncate($handle, 0);
        rewind($handle);
        if (fwrite($handle, $next) === false) {
            throw new RuntimeException('Medienrevision konnte nicht gespeichert werden.');
        }
        fflush($handle);
        @chmod($file, 0664);

        flock($handle, LOCK_UN);
        return $next;
    } finally {
        fclose($handle);
    }
}

function emVersionedMediaUrl(string $url, string $revision, int $mtime = 0): string {
    $separator = str_contains($url, '?') ? '&' : '?';
    $query = 'rev=' . rawurlencode($revision);
    if ($mtime > 0) {
        $query .= '&m=' . $mtime;
    }
    return $url . $separator . $query;
}
