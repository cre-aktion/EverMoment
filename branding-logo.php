<?php
declare(strict_types=1);
require_once __DIR__ . '/includes/config.php';
$config=emLoadConfig();
$name=basename((string)($config['branding']['logo']??''));
if($name===''||!preg_match('/^branding-logo\.(png|jpg|webp)$/',$name)){http_response_code(404);exit;}
$file=emConfigDir().'/'.$name;
if(!is_file($file)){http_response_code(404);exit;}
$mime=(new finfo(FILEINFO_MIME_TYPE))->file($file)?:'application/octet-stream';
$mtime=filemtime($file)?:time();
header('Content-Type: '.$mime);
header('Content-Length: '.filesize($file));
header('Cache-Control: no-cache, must-revalidate');
header('Last-Modified: '.gmdate('D, d M Y H:i:s',$mtime).' GMT');
header('ETag: "'.sha1($name.'|'.$mtime.'|'.filesize($file)).'"');
header('X-Content-Type-Options: nosniff');
readfile($file);
