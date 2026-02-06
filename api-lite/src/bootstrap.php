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

// Reuse WP DB settings to avoid duplication
$wpConfig = __DIR__ . '/../../wp-config.php';
if (file_exists($wpConfig)) {
  require_once $wpConfig;
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
} catch (Throwable $e) {
  http_response_code(500);
  echo json_encode(['error' => 'DB connection failed']);
  exit;
}
