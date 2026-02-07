<?php
declare(strict_types=1);

namespace App\Controllers;

use App\Services\AuthService;
use App\Services\EncryptionService;
use App\Models\UserFileModel;

class UserFileController {
  private AuthService $auth;
  private UserFileModel $files;
  private EncryptionService $crypto;

  public function __construct() {
    $this->auth = new AuthService($GLOBALS['DB_PDO']);
    $this->files = new UserFileModel();
    $this->crypto = new EncryptionService();
  }

  private function requireUser(): array {
    $user = $this->auth->getSessionUser();
    if (empty($user)) {
      http_response_code(403);
      return [];
    }
    return $user;
  }

  private function normalizeKind(string $kind): string {
    $kind = strtolower(trim($kind));
    return in_array($kind, ['resume', 'cover'], true) ? $kind : '';
  }

  public function list(): array {
    $user = $this->requireUser();
    if (empty($user)) return ['error' => 'Not logged in'];
    $kind = $this->normalizeKind((string) ($_GET['kind'] ?? ''));
    if (!$kind) {
      http_response_code(422);
      return ['error' => 'Invalid kind'];
    }
    $rows = $this->files->listByUser((int) $user['id'], $kind);
    return array_map(function (array $row) use ($kind): array {
      $time = $row['created_at'] ? strtotime($row['created_at']) : time();
      $token = $row['access_token'] ?? '';
      return [
        'id' => (int) $row['id'],
        'name' => $row['file_name'] ?: ($kind === 'resume' ? 'Resume' : 'Cover Letter'),
        'url' => $token ? "/api/user-file?token={$token}" : '',
        'time' => $time,
        'mime' => $row['mime_type'] ?? '',
        'size' => (int) ($row['file_size'] ?? 0),
      ];
    }, $rows);
  }

  public function upload(): array {
    $user = $this->requireUser();
    if (empty($user)) return ['error' => 'Not logged in'];
    $kind = $this->normalizeKind((string) ($_GET['kind'] ?? $_POST['kind'] ?? ''));
    if (!$kind) {
      http_response_code(422);
      return ['error' => 'Invalid kind'];
    }

    if (empty($_FILES['file']['tmp_name'])) {
      http_response_code(422);
      return ['error' => 'Missing file'];
    }

    $file = $_FILES['file'];
    $tmp = $file['tmp_name'];
    $origName = basename((string) ($file['name'] ?? ($kind === 'resume' ? 'resume.pdf' : 'cover.pdf')));
    $mime = (string) ($file['type'] ?? 'application/octet-stream');
    $size = (int) ($file['size'] ?? 0);
    if ($size <= 0) {
      http_response_code(422);
      return ['error' => 'Empty file'];
    }
    $maxBytes = 8 * 1024 * 1024;
    if ($size > $maxBytes) {
      http_response_code(413);
      return ['error' => 'File too large'];
    }

    $allowed = ['pdf','doc','docx'];
    $ext = strtolower(pathinfo($origName, PATHINFO_EXTENSION));
    if (!$ext || !in_array($ext, $allowed, true)) {
      http_response_code(422);
      return ['error' => 'Invalid file type'];
    }

    $plaintext = @file_get_contents($tmp);
    if ($plaintext === false) {
      http_response_code(500);
      return ['error' => 'Upload failed'];
    }

    $enc = $this->crypto->encrypt($plaintext);
    $uploadDir = __DIR__ . '/../../wp-content/uploads/secure';
    if (!is_dir($uploadDir)) {
      @mkdir($uploadDir, 0755, true);
    }
    $fileName = sprintf('%s_%d_%s.bin', $kind, (int) $user['id'], bin2hex(random_bytes(10)));
    $dest = $uploadDir . '/' . $fileName;
    if (@file_put_contents($dest, $enc['ciphertext']) === false) {
      http_response_code(500);
      return ['error' => 'Failed to store file'];
    }

    $token = rtrim(strtr(base64_encode(random_bytes(24)), '+/', '-_'), '=');
    $id = $this->files->create([
      'user_id' => (int) $user['id'],
      'kind' => $kind,
      'file_name' => $origName,
      'mime_type' => $mime,
      'file_size' => $size,
      'storage_path' => $dest,
      'iv' => $enc['iv'],
      'tag' => $enc['tag'],
      'access_token' => $token,
      'created_at' => date('Y-m-d H:i:s'),
    ]);

    return [
      'id' => $id,
      'url' => "/api/user-file?token={$token}",
    ];
  }

  public function delete(): array {
    $user = $this->requireUser();
    if (empty($user)) return ['error' => 'Not logged in'];
    $payload = $_POST;
    if (empty($payload)) {
      $raw = file_get_contents('php://input');
      $json = json_decode($raw, true);
      if (is_array($json)) {
        $payload = $json;
      }
    }
    $id = (int) ($payload['id'] ?? 0);
    if (!$id) {
      http_response_code(422);
      return ['error' => 'Missing id'];
    }
    $row = $this->files->deleteById($id, (int) $user['id']);
    if (!$row) {
      http_response_code(404);
      return ['error' => 'Not found'];
    }
    $path = $row['storage_path'] ?? '';
    if ($path && file_exists($path)) {
      @unlink($path);
    }
    return ['ok' => true];
  }

  public function download(): void {
    $token = (string) ($_GET['token'] ?? '');
    $id = (int) ($_GET['id'] ?? 0);
    $row = null;
    if ($token) {
      $row = $this->files->findByToken($token);
    } elseif ($id) {
      $user = $this->requireUser();
      if (empty($user)) {
        echo json_encode(['error' => 'Not logged in']);
        return;
      }
      $row = $this->files->findById($id);
      if ($row && (int) $row['user_id'] !== (int) $user['id']) {
        http_response_code(403);
        echo json_encode(['error' => 'Access denied']);
        return;
      }
    }
    if (!$row) {
      http_response_code(404);
      echo 'File not found';
      return;
    }
    $path = $row['storage_path'] ?? '';
    if (!$path || !file_exists($path)) {
      http_response_code(404);
      echo 'File missing';
      return;
    }
    $ciphertext = @file_get_contents($path);
    if ($ciphertext === false) {
      http_response_code(500);
      echo 'Read failed';
      return;
    }
    $plaintext = $this->crypto->decrypt($ciphertext, (string) $row['iv'], (string) $row['tag']);
    $mime = $row['mime_type'] ?? 'application/octet-stream';
    $name = $row['file_name'] ?? 'file';
    header('Content-Type: ' . $mime);
    header('Content-Disposition: inline; filename="' . addslashes($name) . '"');
    header('Content-Length: ' . strlen($plaintext));
    echo $plaintext;
    exit;
  }
}
