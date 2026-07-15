<?php
declare(strict_types=1);

function emConfigDir(): string { return __DIR__ . '/../config'; }
function emStorageDir(): string { return __DIR__ . '/../storage'; }
function emPlayerConfigFile(): string { return emConfigDir() . '/player.json'; }
function emSecurityFile(): string { return emConfigDir() . '/security.php'; }

function emDefaults(): array {
    return [
        'branding' => [
            'title' => 'EverMoment',
            'subtitle' => 'Beautiful photo & video presentations.',
            'logo' => ''
        ],
        'intro' => [
            'enabled' => true,
            'title' => 'Deine schönsten Momente',
            'subtitle' => 'Fotos und Videos gemeinsam erleben',
            'line3' => '',
            'duration' => 4500
        ],
        'greeting' => [
            'enabled' => true,
            'title' => 'Willkommen',
            'text' => 'Schön, dass du dabei bist. Schau dir die Bilder an und lade gern deine eigenen Erinnerungen hoch.',
            'duration' => 4000,
            'firstVisitOnly' => false
        ],
        'uploads' => [
            'enabled' => false,
            'buttonLabel' => 'Medien hochladen',
            'maxFileSizeMb' => 250,
            'openUntil' => '',
            'allowedExtensions' => ['jpg','jpeg','png','webp','gif','mp4','webm','mov','m4v']
        ],
        'qr' => [
            'galleryUrl' => ''
        ]
    ];
}

function emMerge(array $defaults, array $custom): array {
    foreach ($custom as $key => $value) {
        if (is_array($value) && isset($defaults[$key]) && is_array($defaults[$key])) {
            $defaults[$key] = emMerge($defaults[$key], $value);
        } else {
            $defaults[$key] = $value;
        }
    }
    return $defaults;
}

function emLoadConfig(): array {
    $file = emPlayerConfigFile();
    if (!is_file($file)) return emDefaults();
    $data = json_decode((string)file_get_contents($file), true);
    return is_array($data) ? emMerge(emDefaults(), $data) : emDefaults();
}

function emAtomicWrite(string $file, string $content): void {
    $dir = dirname($file);
    if (!is_dir($dir) && !mkdir($dir, 0775, true) && !is_dir($dir)) {
        throw new RuntimeException('Verzeichnis konnte nicht erstellt werden.');
    }
    $tmp = $file . '.tmp.' . bin2hex(random_bytes(6));
    if (file_put_contents($tmp, $content, LOCK_EX) === false) throw new RuntimeException('Datei konnte nicht geschrieben werden.');
    @chmod($tmp, 0664);
    if (!rename($tmp, $file)) { @unlink($tmp); throw new RuntimeException('Datei konnte nicht übernommen werden.'); }
}

function emSaveConfig(array $config): void {
    emAtomicWrite(emPlayerConfigFile(), json_encode($config, JSON_PRETTY_PRINT|JSON_UNESCAPED_UNICODE|JSON_UNESCAPED_SLASHES) . "\n");
}

function emSecurity(): array {
    $file = emSecurityFile();
    if (!is_file($file)) return [];
    $value = require $file;
    return is_array($value) ? $value : [];
}

function emSaveSecurity(array $security): void {
    $php = "<?php\ndeclare(strict_types=1);\nreturn " . var_export($security, true) . ";\n";
    emAtomicWrite(emSecurityFile(), $php);
}

function emSanitizeConfig(array $input): array {
    $d = emDefaults();
    $text = static fn($v,$max=200) => mb_substr(trim((string)$v),0,$max);
    $bool = static fn($v) => filter_var($v,FILTER_VALIDATE_BOOL);
    $int = static fn($v,$min,$max) => max($min,min($max,(int)$v));
    $allowed = ['jpg','jpeg','png','webp','gif','mp4','webm','mov','m4v'];
    $ext = array_values(array_intersect($allowed, array_map('strtolower', (array)($input['uploads']['allowedExtensions']??[]))));
    if (!$ext) $ext=$allowed;
    return [
      'branding'=>[
        'title'=>$text($input['branding']['title']??$d['branding']['title'],80),
        'subtitle'=>$text($input['branding']['subtitle']??$d['branding']['subtitle'],160),
        'logo'=>$text($input['branding']['logo']??($d['branding']['logo']??''),180)
      ],
      'intro'=>['enabled'=>$bool($input['intro']['enabled']??true),'title'=>$text($input['intro']['title']??'',120),'subtitle'=>$text($input['intro']['subtitle']??'',180),'line3'=>$text($input['intro']['line3']??'',120),'duration'=>$int($input['intro']['duration']??4500,1000,20000)],
      'greeting'=>['enabled'=>$bool($input['greeting']['enabled']??true),'title'=>$text($input['greeting']['title']??'',120),'text'=>$text($input['greeting']['text']??'',600),'duration'=>$int($input['greeting']['duration']??4000,1000,30000),'firstVisitOnly'=>$bool($input['greeting']['firstVisitOnly']??false)],
      'uploads'=>['enabled'=>$bool($input['uploads']['enabled']??false),'buttonLabel'=>$text($input['uploads']['buttonLabel']??'Medien hochladen',60),'maxFileSizeMb'=>$int($input['uploads']['maxFileSizeMb']??250,1,2048),'openUntil'=>$text($input['uploads']['openUntil']??'',40),'allowedExtensions'=>$ext],
      'qr'=>['galleryUrl'=>filter_var(trim((string)($input['qr']['galleryUrl']??'')),FILTER_VALIDATE_URL) ?: '']
    ];
}
