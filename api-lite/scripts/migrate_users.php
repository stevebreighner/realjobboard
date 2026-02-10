<?php
declare(strict_types=1);

require __DIR__ . '/../src/bootstrap.php';

$pdo = $GLOBALS['DB_PDO'];
$prefix = $GLOBALS['DB_PREFIX'] ?? 'wp_';

function runSchema(PDO $pdo): void {
  $schema = file_get_contents(__DIR__ . '/../schema.sql');
  if ($schema === false) {
    throw new RuntimeException('schema.sql missing');
  }
  foreach (array_filter(array_map('trim', explode(';', $schema))) as $stmt) {
    $pdo->exec($stmt);
  }
}

runSchema($pdo);

$users = $pdo->query("SELECT ID, user_login, user_email, user_pass, user_registered 
                      FROM {$prefix}users")->fetchAll();

$insertUser = $pdo->prepare("
  INSERT INTO jb_users (wp_user_id, username, email, password_hash, role, email_verified, employer_verified, created_at, updated_at)
  VALUES (:wp_user_id, :username, :email, :password_hash, :role, :email_verified, :employer_verified, :created_at, :updated_at)
  ON DUPLICATE KEY UPDATE 
    username=VALUES(username),
    email=VALUES(email),
    password_hash=VALUES(password_hash),
    updated_at=VALUES(updated_at)
");

$roleStmt = $pdo->prepare("SELECT meta_value FROM {$prefix}usermeta WHERE user_id = :id AND meta_key = '{$prefix}capabilities'");

foreach ($users as $user) {
  $roleStmt->execute([':id' => $user['ID']]);
  $caps = $roleStmt->fetchColumn();
  $role = 'employee';
  if ($caps && is_string($caps)) {
    if (strpos($caps, 'employer') !== false) {
      $role = 'employer';
    } elseif (strpos($caps, 'administrator') !== false || strpos($caps, 'site_admin') !== false) {
      $role = 'site_admin';
    }
  }

  $insertUser->execute([
    ':wp_user_id' => $user['ID'],
    ':username' => $user['user_login'],
    ':email' => $user['user_email'],
    ':password_hash' => $user['user_pass'],
    ':role' => $role,
    ':email_verified' => 1,
    ':employer_verified' => $role === 'employer' ? 0 : 1,
    ':created_at' => $user['user_registered'],
    ':updated_at' => $user['user_registered'],
  ]);
}

$count = (int) $pdo->query("SELECT COUNT(*) FROM jb_users")->fetchColumn();
echo "Migrated users: {$count}\n";
