<?php
declare(strict_types=1);
require_once __DIR__ . '/includes/config.php';

session_name('evermoment_admin');
session_set_cookie_params(['httponly'=>true,'samesite'=>'Strict','secure'=>!empty($_SERVER['HTTPS'])&&$_SERVER['HTTPS']!=='off']);
session_start();
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

function outLogo(array $data,int $code=200): never { http_response_code($code); echo json_encode($data,JSON_UNESCAPED_UNICODE|JSON_UNESCAPED_SLASHES); exit; }
if(empty($_SESSION['em_admin'])) outLogo(['ok'=>false,'error'=>'Nicht angemeldet.'],401);
$csrf=(string)($_POST['csrf']??'');
if(empty($_SESSION['em_csrf'])||!hash_equals((string)$_SESSION['em_csrf'],$csrf)) outLogo(['ok'=>false,'error'=>'Ungültiges Sicherheitstoken.'],403);

$config=emLoadConfig();
$dir=emConfigDir();
$action=(string)($_GET['action']??'upload');

if($action==='delete'){
  foreach(glob($dir.'/branding-logo.*')?:[] as $file) @unlink($file);
  $config['branding']['logo']='';
  emSaveConfig(emSanitizeConfig($config));
  outLogo(['ok'=>true,'config'=>emLoadConfig()]);
}

if(empty($_FILES['logo'])||!is_uploaded_file($_FILES['logo']['tmp_name'])) outLogo(['ok'=>false,'error'=>'Keine Logodatei empfangen.'],400);
$f=$_FILES['logo'];
if($f['error']!==UPLOAD_ERR_OK) outLogo(['ok'=>false,'error'=>'Uploadfehler '.$f['error']],400);
if((int)$f['size']>5*1024*1024) outLogo(['ok'=>false,'error'=>'Das Logo darf maximal 5 MB groß sein.'],413);

$ext=strtolower(pathinfo((string)$f['name'],PATHINFO_EXTENSION));
$allowed=['png'=>['image/png'],'jpg'=>['image/jpeg'],'jpeg'=>['image/jpeg'],'webp'=>['image/webp']];
$mime=(new finfo(FILEINFO_MIME_TYPE))->file($f['tmp_name'])?:'';
if(!isset($allowed[$ext])||!in_array($mime,$allowed[$ext],true)) outLogo(['ok'=>false,'error'=>'Erlaubt sind PNG, JPG und WebP.'],415);

if(!is_dir($dir)&&!mkdir($dir,0775,true)&&!is_dir($dir)) outLogo(['ok'=>false,'error'=>'Konfigurationsordner konnte nicht erstellt werden.'],500);
$ext=$ext==='jpeg'?'jpg':$ext;
$name='branding-logo.'.$ext;
$target=$dir.'/'.$name;
foreach(glob($dir.'/branding-logo.*')?:[] as $old) if($old!==$target) @unlink($old);
if(!move_uploaded_file($f['tmp_name'],$target)) outLogo(['ok'=>false,'error'=>'Logo konnte nicht gespeichert werden.'],500);
@chmod($target,0664);

$config['branding']['logo']=$name;
emSaveConfig(emSanitizeConfig($config));
outLogo(['ok'=>true,'config'=>emLoadConfig()]);
