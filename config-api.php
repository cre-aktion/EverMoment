<?php
declare(strict_types=1);
require_once __DIR__ . '/includes/config.php';
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
$config=emLoadConfig();
$security=emSecurity();
echo json_encode(['ok'=>true,'config'=>$config,'systemConfigured'=>!empty($security['password_hash'])],JSON_UNESCAPED_UNICODE|JSON_UNESCAPED_SLASHES);
