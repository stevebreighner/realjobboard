<?php
// ---------------------------------------------------------------------------
// BOOTSTRAP: sessions, CORS, and basic setup
// ---------------------------------------------------------------------------

// Helper to get HTTP Origin header safely.
if (!function_exists('get_http_origin')) {
  function get_http_origin() {
    if (isset($_SERVER['HTTP_ORIGIN'])) {
      return $_SERVER['HTTP_ORIGIN'];
    }
    if (isset($_SERVER['HTTP_REFERER'])) {
      $referer = $_SERVER['HTTP_REFERER'];
      $parts = parse_url($referer);
      if (isset($parts['scheme']) && isset($parts['host'])) {
        return $parts['scheme'] . '://' . $parts['host'] . (isset($parts['port']) ? ':' . $parts['port'] : '');
      }
    }
    return '';
  }
}

// SESSION + CORS SETUP (persistent cookie with 7-day expiration)
add_action('init', function () {
  if (!session_id()) {
    session_start();
  }

  if (!headers_sent()) {
    setcookie(session_name(), session_id(), [
      'expires'  => time() + 60 * 60 * 24 * 7, // 7 days
      'path'     => '/',
      'secure'   => is_ssl(),
      'httponly' => true,
      'samesite' => 'Lax',
    ]);
  }

  if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    $origin = get_http_origin();

    if (
      preg_match('#^http://(localhost|127\.0\.0\.1)(:\d+)?$#', $origin) ||
      $origin === 'http://localhost:5174' ||
      $origin === 'https://jobs.stephenbreighner.com'
    ) {
      header("Access-Control-Allow-Origin: $origin");
      header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
      header("Access-Control-Allow-Credentials: true");
      header("Access-Control-Allow-Headers: Origin, Content-Type, Authorization, X-Requested-With");
      header("Vary: Origin");
    }
    exit(0);
  }
}, 1);

// Ensure custom admin role exists.
add_action('init', function () {
  if (!get_role('site_admin')) {
    add_role('site_admin', 'Site Admin');
  }
});

// CORS for REST API responses.
add_action('rest_api_init', function () {
  add_filter('rest_pre_serve_request', function ($served, $result, $request, $server) {
    $origin = get_http_origin();

    if (
      preg_match('#^http://(localhost|127\.0\.0\.1)(:\d+)?$#', $origin) ||
      $origin === 'http://localhost:5174' ||
      $origin === 'https://jobs.stephenbreighner.com'
    ) {
      header("Access-Control-Allow-Origin: $origin");
      header("Access-Control-Allow-Credentials: true");
      header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
      header("Access-Control-Allow-Headers: Origin, Content-Type, Authorization, X-Requested-With");
      header("Vary: Origin");
    }

    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
      header("HTTP/1.1 200 OK");
      exit(0);
    }

    return $served;
  }, 10, 4);
});

// Allow resume uploads (PDF/DOC/DOCX).
add_filter('upload_mimes', function($mimes) {
  $mimes['doc']  = 'application/msword';
  $mimes['docx'] = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
  $mimes['pdf']  = 'application/pdf';
  return $mimes;
});
