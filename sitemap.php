<?php
declare(strict_types=1);

$host = trim((string) ($_SERVER['HTTP_HOST'] ?? 'localhost'));
$scheme = 'http';
if (!empty($_SERVER['HTTP_X_FORWARDED_PROTO'])) {
  $scheme = strtolower((string) $_SERVER['HTTP_X_FORWARDED_PROTO']) === 'https' ? 'https' : 'http';
} elseif (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') {
  $scheme = 'https';
}

$base = $scheme . '://' . $host;

header('Content-Type: application/xml; charset=UTF-8');
header('Cache-Control: no-cache, no-store, must-revalidate');

echo '<?xml version="1.0" encoding="UTF-8"?>';
echo "\n";
echo '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">';
echo "\n";
echo '  <url>';
echo "\n";
echo '    <loc>' . htmlspecialchars($base . '/', ENT_QUOTES) . '</loc>';
echo "\n";
echo '    <changefreq>daily</changefreq>';
echo "\n";
echo '    <priority>1.0</priority>';
echo "\n";
echo '  </url>';
echo "\n";
echo '</urlset>';
echo "\n";
