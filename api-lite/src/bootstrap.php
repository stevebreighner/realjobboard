<?php
declare(strict_types=1);

spl_autoload_register(function ($class) {
  $prefix = 'App\\';
  if (strncmp($class, $prefix, strlen($prefix)) !== 0) {
    return;
  }
  $relative = substr($class, strlen($prefix));
  $relative = str_replace('\\', '/', $relative);
  $file = __DIR__ . '/' . $relative . '.php';
  if (file_exists($file)) {
    require $file;
  }
});

// Load .env (simple parser)
$envPath = __DIR__ . '/../../.env';
if (file_exists($envPath)) {
  $lines = file($envPath, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
  if ($lines !== false) {
    foreach ($lines as $line) {
      $line = trim($line);
      if ($line === '' || ($line[0] ?? '') === '#') {
        continue;
      }
      $parts = explode('=', $line, 2);
      if (count($parts) !== 2) {
        continue;
      }
      $key = trim($parts[0]);
      $val = trim($parts[1]);
      if ($val !== '' && $val[0] === '"' && substr($val, -1) === '"') {
        $val = substr($val, 1, -1);
      }
      $_ENV[$key] = $val;
      putenv($key . '=' . $val);
    }
  }
}

// Reuse WP DB settings without loading full WP
$wpConfig = __DIR__ . '/../../wp-config.php';
if (file_exists($wpConfig)) {
  $configRaw = file_get_contents($wpConfig);
  if ($configRaw !== false) {
    $defs = [
      'DB_NAME' => null,
      'DB_USER' => null,
      'DB_PASSWORD' => null,
      'DB_HOST' => null,
    ];
    foreach ($defs as $key => $_) {
      if (!defined($key) && preg_match("/define\\(\\s*'{$key}'\\s*,\\s*'([^']*)'\\s*\\)\\s*;/", $configRaw, $m)) {
        define($key, $m[1]);
      }
    }
    if (preg_match('/\\$table_prefix\\s*=\\s*\\\'([^\\\']+)\\\'\\s*;/', $configRaw, $m)) {
      $GLOBALS['DB_PREFIX'] = $m[1];
    }
  }
}

if (!defined('DB_HOST')) {
  http_response_code(500);
  echo json_encode(['error' => 'DB config missing']);
  exit;
}

// Simple DB connection (PDO)
try {
  $dsn = sprintf('mysql:host=%s;dbname=%s;charset=utf8mb4', DB_HOST, DB_NAME);
  $GLOBALS['DB_PDO'] = new PDO($dsn, DB_USER, DB_PASSWORD, [
    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
  ]);
  $GLOBALS['DB_PDO']->exec('SET sql_mode = "STRICT_ALL_TABLES"');
} catch (Throwable $e) {
  http_response_code(500);
  echo json_encode(['error' => 'DB connection failed']);
  exit;
}

header('Content-Type: application/json; charset=utf-8');
