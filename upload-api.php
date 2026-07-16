<?php
declare(strict_types=1);
require_once __DIR__ . '/includes/config.php';
require_once __DIR__ . '/includes/media-revision.php';
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
function fail(string $m,int $c=400): never { http_response_code($c); echo json_encode(['ok'=>false,'error'=>$m],JSON_UNESCAPED_UNICODE); exit; }
$config=emLoadConfig(); $u=$config['uploads'];
if(empty($u['enabled'])) fail('Uploads sind deaktiviert.',403);
if(!empty($u['openUntil'])) { $until=strtotime($u['openUntil']); if($until!==false && time()>$until) fail('Der Uploadzeitraum ist beendet.',403); }
if(empty($_FILES['file'])||!is_uploaded_file($_FILES['file']['tmp_name'])) fail('Keine Datei empfangen.');
$f=$_FILES['file']; if($f['error']!==UPLOAD_ERR_OK) fail('Uploadfehler '.$f['error']);
$max=(int)$u['maxFileSizeMb']*1024*1024; if((int)$f['size']>$max) fail('Datei ist zu groß.',413);
$ext=strtolower(pathinfo((string)$f['name'],PATHINFO_EXTENSION));
if(!in_array($ext,(array)$u['allowedExtensions'],true)) fail('Dateiformat nicht erlaubt.',415);
$mime=(new finfo(FILEINFO_MIME_TYPE))->file($f['tmp_name'])?:'';
$mimeMap=['jpg'=>['image/jpeg'],'jpeg'=>['image/jpeg'],'png'=>['image/png'],'webp'=>['image/webp'],'gif'=>['image/gif'],'mp4'=>['video/mp4','application/mp4'],'webm'=>['video/webm'],'mov'=>['video/quicktime'],'m4v'=>['video/x-m4v','video/mp4']];
if(!isset($mimeMap[$ext])||!in_array($mime,$mimeMap[$ext],true)) fail('Dateiinhalt passt nicht zum Format.',415);
$targetDir=__DIR__.'/public/img'; if(!is_dir($targetDir)) fail('Medienordner public/img fehlt.',500);
$storage=emStorageDir(); if(!is_dir($storage)&&!mkdir($storage,0775,true)&&!is_dir($storage)) fail('Speicherordner nicht verfügbar.',500);
$lock=fopen($storage.'/upload.lock','c+'); if(!$lock||!flock($lock,LOCK_EX)) fail('Upload konnte nicht reserviert werden.',500);
try {
  $maxNo=-1; foreach(new DirectoryIterator($targetDir) as $item){ if($item->isFile()&&preg_match('/^(\d+)/',$item->getFilename(),$m)) $maxNo=max($maxNo,(int)$m[1]); }
  $next=$maxNo+1; $width=max(3,strlen((string)$next)); $name=str_pad((string)$next,$width,'0',STR_PAD_LEFT).'.'.$ext; $dest=$targetDir.'/'.$name;
  while(file_exists($dest)){ $next++; $width=max(3,strlen((string)$next)); $name=str_pad((string)$next,$width,'0',STR_PAD_LEFT).'.'.$ext; $dest=$targetDir.'/'.$name; }
  if(!move_uploaded_file($f['tmp_name'],$dest)) fail('Datei konnte nicht gespeichert werden.',500);
  @chmod($dest,0664);

  // Der eigentliche Upload gilt als erfolgreich, sobald die Datei gespeichert ist.
  // Ein Fehler beim Aktualisieren der Cache-Revision darf diesen Erfolg nicht
  // nachträglich in einen HTTP-500-Fehler verwandeln.
  $revision=(string)max(1,time());
  $revisionWarning=null;
  try {
    $revision=emBumpMediaRevision();
  } catch (Throwable $revisionError) {
    $revisionWarning='Medienrevision konnte nicht aktualisiert werden.';
    error_log('EverMoment upload revision warning: '.$revisionError->getMessage());
    try {
      $revision=emMediaRevision();
    } catch (Throwable $fallbackError) {
      error_log('EverMoment upload revision fallback warning: '.$fallbackError->getMessage());
    }
  }
} catch (Throwable $error) {
  error_log('EverMoment upload error: '.$error->getMessage());
  fail('Interner Serverfehler beim Upload.',500);
} finally {
  flock($lock,LOCK_UN);
  fclose($lock);
}

$response=['ok'=>true,'name'=>$name,'revision'=>$revision];
if($revisionWarning!==null) $response['warning']=$revisionWarning;
echo json_encode($response,JSON_UNESCAPED_UNICODE|JSON_UNESCAPED_SLASHES);
