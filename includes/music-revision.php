<?php
declare(strict_types=1);

function emMusicRevisionFile(): string {
    $storage = __DIR__ . '/../storage';
    if (!is_dir($storage) && !mkdir($storage, 0775, true) && !is_dir($storage)) {
        throw new RuntimeException('Storage-Ordner konnte nicht erstellt werden.');
    }
    return $storage . '/music-revision.txt';
}

function emMusicRevision(): string {
    $file = emMusicRevisionFile();
    if (!is_file($file)) {
        $initial = (string)max(1, time());
        if (file_put_contents($file, $initial, LOCK_EX) === false) {
            throw new RuntimeException('Musikrevision konnte nicht initialisiert werden.');
        }
        @chmod($file, 0664);
        return $initial;
    }

    $value = trim((string)file_get_contents($file));
    return preg_match('/^\d+$/', $value) ? $value : (string)max(1, time());
}

function emBumpMusicRevision(): string {
    $file = emMusicRevisionFile();
    $handle = fopen($file, 'c+');
    if ($handle === false) {
        throw new RuntimeException('Musikrevision konnte nicht geöffnet werden.');
    }

    try {
        if (!flock($handle, LOCK_EX)) {
            throw new RuntimeException('Musikrevision konnte nicht gesperrt werden.');
        }

        rewind($handle);
        $current = trim((string)stream_get_contents($handle));
        $currentNumber = preg_match('/^\d+$/', $current) ? (int)$current : time();
        $next = (string)max($currentNumber + 1, time());

        ftruncate($handle, 0);
        rewind($handle);

        if (fwrite($handle, $next) === false) {
            throw new RuntimeException('Musikrevision konnte nicht gespeichert werden.');
        }

        fflush($handle);
        @chmod($file, 0664);
        flock($handle, LOCK_UN);

        return $next;
    } finally {
        fclose($handle);
    }
}

function emVersionedMusicUrl(string $url, string $revision, int $mtime = 0): string {
    $separator = str_contains($url, '?') ? '&' : '?';
    $query = 'mrev=' . rawurlencode($revision);

    if ($mtime > 0) {
        $query .= '&m=' . $mtime;
    }

    return $url . $separator . $query;
}
