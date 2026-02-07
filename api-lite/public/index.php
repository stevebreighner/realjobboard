<?php
declare(strict_types=1);

require __DIR__ . '/../src/bootstrap.php';

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
$path = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH);

// Strip optional /api-lite/public prefix if present
$path = rtrim($path, '/');

$ip = $_SERVER['REMOTE_ADDR'] ?? '';
$blockedRaw = $_ENV['BLOCKED_IPS'] ?? '';
if ($blockedRaw && $ip) {
  $blocked = array_filter(array_map('trim', explode(',', $blockedRaw)));
  if (in_array($ip, $blocked, true)) {
    http_response_code(403);
    echo json_encode(['error' => 'Access denied']);
    exit;
  }
}

$routes = require __DIR__ . '/../routes.php';

$handler = $routes[$method][$path] ?? null;
if (!$handler) {
  http_response_code(404);
  echo json_encode(['error' => 'Not found']);
  exit;
}

try {
  $result = $handler();
  header('Content-Type: application/json; charset=utf-8');
  echo json_encode($result);
} catch (Throwable $e) {
  $logDir = __DIR__ . '/../logs';
  if (!is_dir($logDir)) {
    @mkdir($logDir, 0755, true);
  }
  $logFile = $logDir . '/api-error.log';
  $line = sprintf(
    "[%s] %s in %s:%d\n",
    date('c'),
    $e->getMessage(),
    $e->getFile(),
    $e->getLine()
  );
  @file_put_contents($logFile, $line, FILE_APPEND);
  http_response_code(500);
  header('Content-Type: application/json; charset=utf-8');
  echo json_encode(['error' => 'Server error']);
}
