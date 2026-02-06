<?php
declare(strict_types=1);

require __DIR__ . '/../src/bootstrap.php';

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
$path = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH);

// Strip optional /api-lite/public prefix if present
$path = rtrim($path, '/');

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
  http_response_code(500);
  header('Content-Type: application/json; charset=utf-8');
  echo json_encode(['error' => 'Server error', 'message' => $e->getMessage()]);
}
