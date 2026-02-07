<?php
declare(strict_types=1);

namespace App\Controllers;

use App\Services\AuthService;
use App\Services\EncryptionService;
use App\Models\UserFileModel;
use App\Models\UserProfileModel;

class UserFileController {
  private AuthService $auth;
  private UserFileModel $files;
  private EncryptionService $crypto;
  private UserProfileModel $profiles;

  public function __construct() {
    $this->auth = new AuthService($GLOBALS['DB_PDO']);
    $this->files = new UserFileModel();
    $this->crypto = new EncryptionService();
    $this->profiles = new UserProfileModel();
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

  public function listResumes(): array {
    $_GET['kind'] = 'resume';
    return $this->list();
  }

  public function listCovers(): array {
    $_GET['kind'] = 'cover';
    return $this->list();
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

    $rawFile = @file_get_contents($tmp);
    if ($rawFile === false) {
      http_response_code(500);
      return ['error' => 'Upload failed'];
    }

    $enc = $this->crypto->encrypt($rawFile);
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

    if ($kind === 'resume') {
      $text = $this->extractTextFromFile($tmp, $ext);
      if ($text) {
        $parsed = $this->parseResume($text);
        $excerpt = mb_substr($text, 0, 4000);
        $this->profiles->setMeta((int) $user['id'], 'resume_text', $excerpt);
        if (!empty($parsed['skills'])) {
          $this->profiles->setMeta((int) $user['id'], 'resume_skills', implode(', ', $parsed['skills']));
        }
        if (!empty($parsed['email'])) {
          $this->profiles->setMeta((int) $user['id'], 'resume_email', $parsed['email']);
        }
        if (!empty($parsed['phone'])) {
          $this->profiles->setMeta((int) $user['id'], 'resume_phone', $parsed['phone']);
        }
        $existing = $this->profiles->getMeta((int) $user['id'], ['first_name', 'last_name']);
        if (empty($existing['first_name']) && empty($existing['last_name']) && !empty($parsed['name'])) {
          $parts = preg_split('/\s+/', $parsed['name']);
          $first = array_shift($parts) ?: '';
          $last = implode(' ', $parts);
          if ($first) $this->profiles->setMeta((int) $user['id'], 'first_name', $first);
          if ($last) $this->profiles->setMeta((int) $user['id'], 'last_name', $last);
        }
      }
    }

    return [
      'id' => $id,
      'url' => "/api/user-file?token={$token}",
    ];
  }

  public function uploadResume(): array {
    $_POST['kind'] = 'resume';
    $_GET['kind'] = 'resume';
    return $this->upload();
  }

  public function uploadCover(): array {
    $_POST['kind'] = 'cover';
    $_GET['kind'] = 'cover';
    return $this->upload();
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

  private function extractTextFromFile(string $path, string $ext): string {
    $ext = strtolower($ext);
    if ($ext === 'pdf') {
      $bin = trim((string) @shell_exec('command -v pdftotext'));
      if ($bin) {
        $tmpOut = tempnam(sys_get_temp_dir(), 'resume_');
        @shell_exec(sprintf('pdftotext %s %s 2>/dev/null', escapeshellarg($path), escapeshellarg($tmpOut)));
        $text = @file_get_contents($tmpOut) ?: '';
        @unlink($tmpOut);
        return $this->normalizeText($text);
      }
      return '';
    }
    if ($ext === 'docx') {
      $zip = new \ZipArchive();
      if ($zip->open($path) === true) {
        $xml = $zip->getFromName('word/document.xml');
        $zip->close();
        if ($xml) {
          $text = strip_tags($xml);
          return $this->normalizeText($text);
        }
      }
      return '';
    }
    if ($ext === 'doc' || $ext === 'txt') {
      $raw = @file_get_contents($path) ?: '';
      return $this->normalizeText($raw);
    }
    return '';
  }

  private function normalizeText(string $text): string {
    $text = preg_replace('/\s+/', ' ', $text);
    return trim((string) $text);
  }

  private function parseResume(string $text): array {
    $result = [
      'name' => '',
      'email' => '',
      'phone' => '',
      'skills' => [],
    ];
    if (preg_match('/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i', $text, $m)) {
      $result['email'] = $m[0];
    }
    if (preg_match('/(\+?1[\s.-]?)?(\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4})/', $text, $m)) {
      $result['phone'] = $m[0];
    }
    $lines = preg_split('/[\r\n]+/', $text);
    foreach ($lines as $line) {
      $line = trim($line);
      if (strlen($line) < 3) continue;
      if (preg_match('/^[A-Za-z]+(?:\s+[A-Za-z.]+){1,3}$/', $line)) {
        $result['name'] = $line;
        break;
      }
    }
    $skillKeywords = [
      'javascript','typescript','react','vue','angular','node','python','java','c#','c++','php','sql','mysql','postgres',
      'aws','azure','gcp','docker','kubernetes','html','css','figma','salesforce','excel','photoshop','illustrator',
      'nurse','rn','lpn','cna','caregiver','server','barista','cashier','mechanic','technician','manager','marketing',
    ];
    $lower = strtolower($text);
    $skills = [];
    foreach ($skillKeywords as $skill) {
      if (strpos($lower, $skill) !== false) {
        $skills[] = $skill;
      }
    }
    $result['skills'] = array_values(array_unique($skills));
    return $result;
  }
}
