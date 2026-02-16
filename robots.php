<?php
declare(strict_types=1);

$host = strtolower(trim((string) ($_SERVER['HTTP_HOST'] ?? 'localhost')));
$hostNoWww = preg_replace('/^www\./', '', $host);
$isDev = ($hostNoWww === 'jobs.stephenbreighner.com');

$scheme = 'http';
if (!empty($_SERVER['HTTP_X_FORWARDED_PROTO'])) {
  $scheme = strtolower((string) $_SERVER['HTTP_X_FORWARDED_PROTO']) === 'https' ? 'https' : 'http';
} elseif (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') {
  $scheme = 'https';
}

header('Content-Type: text/plain; charset=UTF-8');
header('Cache-Control: no-cache, no-store, must-revalidate');

$base = $scheme . '://' . $host;
if ($isDev) {
  echo "User-agent: *\n";
  echo "Disallow: /\n\n";
  echo "Sitemap: {$base}/sitemap.xml\n";
  exit;
}

echo "User-agent: *\n";
echo "Allow: /\n\n";
echo "Sitemap: {$base}/sitemap.xml\n";
