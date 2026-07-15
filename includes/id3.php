<?php
declare(strict_types=1);


function id3SynchsafeToInt(string $bytes): int {
    if (strlen($bytes) !== 4) return 0;
    return ((ord($bytes[0]) & 0x7F) << 21)
        | ((ord($bytes[1]) & 0x7F) << 14)
        | ((ord($bytes[2]) & 0x7F) << 7)
        | (ord($bytes[3]) & 0x7F);
}

function id3BigEndianToInt(string $bytes): int {
    $value = 0;
    for ($i = 0, $len = strlen($bytes); $i < $len; $i++) {
        $value = ($value << 8) | ord($bytes[$i]);
    }
    return $value;
}

function id3RemoveUnsynchronisation(string $data): string {
    return str_replace("\xFF\x00", "\xFF", $data);
}

function id3ConvertText(string $data, int $encoding): string {
    if ($data === '') return '';

    $from = 'ISO-8859-1';
    if ($encoding === 1) {
        if (str_starts_with($data, "\xFF\xFE")) {
            $from = 'UTF-16LE';
            $data = substr($data, 2);
        } elseif (str_starts_with($data, "\xFE\xFF")) {
            $from = 'UTF-16BE';
            $data = substr($data, 2);
        } else {
            $from = 'UTF-16';
        }
    } elseif ($encoding === 2) {
        $from = 'UTF-16BE';
    } elseif ($encoding === 3) {
        $from = 'UTF-8';
    }

    if ($from !== 'UTF-8') {
        if (function_exists('mb_convert_encoding')) {
            $data = mb_convert_encoding($data, 'UTF-8', $from);
        } elseif (function_exists('iconv')) {
            $converted = @iconv($from, 'UTF-8//IGNORE', $data);
            if ($converted !== false) $data = $converted;
        }
    }

    $data = str_replace("\0", '', $data);
    return trim($data);
}

function id3ReadTerminated(string $data, int $offset, int $encoding): array {
    $length = strlen($data);
    $double = ($encoding === 1 || $encoding === 2);
    $terminatorLength = $double ? 2 : 1;

    for ($i = $offset; $i <= $length - $terminatorLength; $i += $double ? 2 : 1) {
        if ($double) {
            if (substr($data, $i, 2) === "\x00\x00") {
                return [substr($data, $offset, $i - $offset), $i + 2];
            }
        } elseif ($data[$i] === "\x00") {
            return [substr($data, $offset, $i - $offset), $i + 1];
        }
    }

    return [substr($data, $offset), $length];
}

function id3ParsePicture(string $payload, bool $v22 = false): ?array {
    if ($payload === '') return null;
    $encoding = ord($payload[0]);
    $offset = 1;

    if ($v22) {
        if (strlen($payload) < 5) return null;
        $format = strtoupper(substr($payload, $offset, 3));
        $offset += 3;
        $mime = match ($format) {
            'PNG' => 'image/png',
            'GIF' => 'image/gif',
            default => 'image/jpeg',
        };
    } else {
        [$mimeRaw, $offset] = id3ReadTerminated($payload, $offset, 0);
        $mime = trim($mimeRaw) ?: 'image/jpeg';
    }

    if ($offset >= strlen($payload)) return null;
    $pictureType = ord($payload[$offset]);
    $offset++;

    [, $offset] = id3ReadTerminated($payload, $offset, $encoding);
    $binary = substr($payload, $offset);
    if ($binary === '') return null;

    return [
        'mime' => $mime,
        'data' => $binary,
        'type' => $pictureType,
    ];
}

function readMp3Id3(string $path, bool $includeCover = true): array {
    $result = ['title' => null, 'artist' => null, 'cover' => null];
    $handle = @fopen($path, 'rb');
    if (!$handle) return $result;

    $header = fread($handle, 10);
    if (strlen($header) === 10 && substr($header, 0, 3) === 'ID3') {
        $major = ord($header[3]);
        $flags = ord($header[5]);
        $tagSize = id3SynchsafeToInt(substr($header, 6, 4));
        if ($tagSize > 0 && $tagSize <= 32 * 1024 * 1024) {
            $tag = fread($handle, $tagSize);
            if (($flags & 0x80) !== 0) $tag = id3RemoveUnsynchronisation($tag);

            $offset = 0;
            if (($flags & 0x40) !== 0 && strlen($tag) >= 4) {
                $extSize = $major === 4
                    ? id3SynchsafeToInt(substr($tag, 0, 4))
                    : id3BigEndianToInt(substr($tag, 0, 4)) + 4;
                if ($extSize > 0 && $extSize < strlen($tag)) $offset = $extSize;
            }

            $headerLength = $major === 2 ? 6 : 10;
            while ($offset + $headerLength <= strlen($tag)) {
                if ($major === 2) {
                    $frameId = substr($tag, $offset, 3);
                    $frameSize = id3BigEndianToInt(substr($tag, $offset + 3, 3));
                } else {
                    $frameId = substr($tag, $offset, 4);
                    $sizeBytes = substr($tag, $offset + 4, 4);
                    $frameSize = $major === 4 ? id3SynchsafeToInt($sizeBytes) : id3BigEndianToInt($sizeBytes);
                }

                if (trim($frameId, "\0 \t\r\n") === '' || $frameSize <= 0) break;
                $payloadOffset = $offset + $headerLength;
                if ($payloadOffset + $frameSize > strlen($tag)) break;
                $payload = substr($tag, $payloadOffset, $frameSize);

                if (($frameId === 'TIT2' || $frameId === 'TT2') && $result['title'] === null && $payload !== '') {
                    $result['title'] = id3ConvertText(substr($payload, 1), ord($payload[0]));
                } elseif (($frameId === 'TPE1' || $frameId === 'TP1') && $result['artist'] === null && $payload !== '') {
                    $result['artist'] = id3ConvertText(substr($payload, 1), ord($payload[0]));
                } elseif ($includeCover && ($frameId === 'APIC' || $frameId === 'PIC')) {
                    $picture = id3ParsePicture($payload, $frameId === 'PIC');
                    if ($picture !== null) {
                        if ($result['cover'] === null || $picture['type'] === 3) {
                            $result['cover'] = $picture;
                            if ($picture['type'] === 3 && $result['title'] !== null && $result['artist'] !== null) {
                            }
                        }
                    }
                }

                $offset = $payloadOffset + $frameSize;
            }
        }
    }

    if (($result['title'] === null || $result['artist'] === null) && fseek($handle, -128, SEEK_END) === 0) {
        $v1 = fread($handle, 128);
        if (strlen($v1) === 128 && substr($v1, 0, 3) === 'TAG') {
            if ($result['title'] === null) $result['title'] = id3ConvertText(rtrim(substr($v1, 3, 30), "\0 "), 0);
            if ($result['artist'] === null) $result['artist'] = id3ConvertText(rtrim(substr($v1, 33, 30), "\0 "), 0);
        }
    }

    fclose($handle);
    if ($result['title'] === '') $result['title'] = null;
    if ($result['artist'] === '') $result['artist'] = null;
    return $result;
}
