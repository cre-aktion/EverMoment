<?php
declare(strict_types=1);
require_once __DIR__ . '/includes/config.php';

session_name('evermoment_admin');
session_set_cookie_params(['httponly'=>true,'samesite'=>'Strict','secure'=>!empty($_SERVER['HTTPS'])&&$_SERVER['HTTPS']!=='off']);
session_start();
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

function out(array $data,int $code=200): never { http_response_code($code); echo json_encode($data,JSON_UNESCAPED_UNICODE|JSON_UNESCAPED_SLASHES); exit; }
function body(): array { $raw=file_get_contents('php://input'); $d=json_decode($raw?:'{}',true); return is_array($d)?$d:[]; }
function authed(): bool { return !empty($_SESSION['em_admin']); }
function csrf(): string { if(empty($_SESSION['em_csrf'])) $_SESSION['em_csrf']=bin2hex(random_bytes(24)); return $_SESSION['em_csrf']; }
function requireAuth(array $b): void { if(!authed()) out(['ok'=>false,'error'=>'Nicht angemeldet.'],401); if(!hash_equals(csrf(),(string)($b['csrf']??''))) out(['ok'=>false,'error'=>'Ungültiges Sicherheitstoken.'],403); }

$action=(string)($_GET['action']??'status');
$security=emSecurity();
if($action==='status') out(['ok'=>true,'configured'=>!empty($security['password_hash']),'authenticated'=>authed(),'csrf'=>authed()?csrf():null]);
$b=body();
if($action==='setup') {
  if(!empty($security['password_hash'])) out(['ok'=>false,'error'=>'Bereits eingerichtet.'],409);
  $pw=(string)($b['password']??''); if(strlen($pw)<8) out(['ok'=>false,'error'=>'Mindestens 8 Zeichen.'],422);
  $raw=strtoupper(bin2hex(random_bytes(12))); $recovery='EM-RCV-'.implode('-',str_split($raw,4));
  emSaveSecurity(['password_hash'=>password_hash($pw,PASSWORD_DEFAULT),'recovery_hash'=>password_hash($recovery,PASSWORD_DEFAULT),'updated_at'=>date(DATE_ATOM)]);
  $_SESSION['em_admin']=true; session_regenerate_id(true);
  out(['ok'=>true,'csrf'=>csrf(),'recoveryKey'=>$recovery]);
}
if($action==='login') {
  if(empty($security['password_hash'])||!password_verify((string)($b['password']??''),$security['password_hash'])) out(['ok'=>false,'error'=>'Passwort falsch.'],401);
  $_SESSION['em_admin']=true; session_regenerate_id(true); out(['ok'=>true,'csrf'=>csrf(),'config'=>emLoadConfig()]);
}
if($action==='logout') { $_SESSION=[]; session_destroy(); out(['ok'=>true]); }
if($action==='get') { if(!authed()) out(['ok'=>false,'error'=>'Nicht angemeldet.'],401); out(['ok'=>true,'csrf'=>csrf(),'config'=>emLoadConfig()]); }
if($action==='save') { requireAuth($b); $config=emSanitizeConfig((array)($b['config']??[])); emSaveConfig($config); out(['ok'=>true,'config'=>$config]); }
if($action==='change-password') { requireAuth($b); if(!password_verify((string)($b['currentPassword']??''),$security['password_hash']??'')) out(['ok'=>false,'error'=>'Aktuelles Passwort falsch.'],401); $new=(string)($b['newPassword']??''); if(strlen($new)<8) out(['ok'=>false,'error'=>'Mindestens 8 Zeichen.'],422); $security['password_hash']=password_hash($new,PASSWORD_DEFAULT); $security['updated_at']=date(DATE_ATOM); emSaveSecurity($security); out(['ok'=>true]); }
if($action==='reset-password') { $key=(string)($b['recoveryKey']??''); $new=(string)($b['newPassword']??''); if(empty($security['recovery_hash'])||!password_verify($key,$security['recovery_hash'])) out(['ok'=>false,'error'=>'Recovery-Key ungültig.'],401); if(strlen($new)<8) out(['ok'=>false,'error'=>'Mindestens 8 Zeichen.'],422); $raw=strtoupper(bin2hex(random_bytes(12))); $newKey='EM-RCV-'.implode('-',str_split($raw,4)); emSaveSecurity(['password_hash'=>password_hash($new,PASSWORD_DEFAULT),'recovery_hash'=>password_hash($newKey,PASSWORD_DEFAULT),'updated_at'=>date(DATE_ATOM)]); $_SESSION['em_admin']=true; session_regenerate_id(true); out(['ok'=>true,'csrf'=>csrf(),'recoveryKey'=>$newKey]); }
out(['ok'=>false,'error'=>'Unbekannte Aktion.'],404);
