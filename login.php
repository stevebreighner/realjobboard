<?php
// login.php

session_start();
header('Content-Type: application/json');

// Track attempts
if (!isset($_SESSION['login_attempts'])) {
  $_SESSION['login_attempts'] = 0;
  $_SESSION['first_attempt'] = time();
}

// Optional reset after 5 minutes
if ((time() - $_SESSION['first_attempt']) >= 300) {
  $_SESSION['login_attempts'] = 0;
  $_SESSION['first_attempt'] = time();
}

if ($_SESSION['login_attempts'] >= 3) {
  http_response_code(429);
  echo json_encode(['error' => 'Too many failed attempts. Try again in a few minutes.']);
  exit;
}

$input = json_decode(file_get_contents('php://input'), true);
$user = $input['user'] ?? '';
$pass = $input['pass'] ?? '';

// Your credentials
$valid_user = 'steveb533';
$valid_pass = '56s"$Z5v?Tb}';

if ($user === $valid_user && $pass === $valid_pass) {
  $_SESSION['logged_in'] = true;
  $_SESSION['login_attempts'] = 0;
  echo json_encode(['status' => 'ok']);
} else {
  $_SESSION['login_attempts']++;
  http_response_code(403);
  echo json_encode(['error' => 'Invalid credentials']);
}
