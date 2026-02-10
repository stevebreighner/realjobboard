<?php
declare(strict_types=1);

namespace App\Controllers;

use App\Services\AuthService;
use App\Models\UserProfileModel;
use App\Models\UserFileModel;

class ProfileController {
  private AuthService $auth;
  private UserProfileModel $profiles;
  private UserFileModel $files;

  public function __construct() {
    $this->auth = new AuthService($GLOBALS['DB_PDO']);
    $this->profiles = new UserProfileModel();
    $this->files = new UserFileModel();
  }

  public function show(): array {
    $user = $this->auth->getSessionUser();
    if (empty($user)) {
      http_response_code(403);
      return ['error' => 'Not logged in'];
    }

    $light = isset($_GET['light']) && $_GET['light'] !== '0';
    $email = (string) ($user['email'] ?? '');
    $username = (string) ($user['username'] ?? '');
    $meta = $this->profiles->getMeta((int) $user['id'], [
      'zip', 'city', 'state', 'country',
      'street1', 'street2',
      'first_name', 'last_name', 'dob',
      'hide_email', 'avatar_url',
      'compliance_gender', 'compliance_race', 'compliance_disability',
      'compliance_veteran', 'compliance_work_auth', 'compliance_prior_employment',
      'compliance_background_check', 'compliance_age_minimum',
    ]);

    if ($light) {
      return [
        'id' => $user['id'],
        'username' => $username,
        'email' => $email,
        'roles' => [$user['role'] ?? 'employee'],
        'zip' => $meta['zip'] ?? '',
      ];
    }

    $resumes = $this->files->listByUser((int) $user['id'], 'resume');
    $covers = $this->files->listByUser((int) $user['id'], 'cover');

    return [
      'id' => $user['id'],
      'username' => $username,
      'email' => $email,
      'roles' => [$user['role'] ?? 'employee'],
      'company' => $user['company_name'] ?? '',
      'company_site' => $user['company_site'] ?? '',
      'company_email' => $user['company_email'] ?? '',
      'zip' => $meta['zip'] ?? '',
      'city' => $meta['city'] ?? '',
      'state' => $meta['state'] ?? '',
      'country' => $meta['country'] ?? '',
      'street1' => $meta['street1'] ?? '',
      'street2' => $meta['street2'] ?? '',
      'first_name' => $meta['first_name'] ?? '',
      'last_name' => $meta['last_name'] ?? '',
      'dob' => $meta['dob'] ?? '',
      'hide_email' => $meta['hide_email'] ?? '',
      'avatar_url' => $meta['avatar_url'] ?? '',
      'compliance_gender' => $meta['compliance_gender'] ?? '',
      'compliance_race' => $meta['compliance_race'] ?? '',
      'compliance_disability' => $meta['compliance_disability'] ?? '',
      'compliance_veteran' => $meta['compliance_veteran'] ?? '',
      'compliance_work_auth' => $meta['compliance_work_auth'] ?? '',
      'compliance_prior_employment' => $meta['compliance_prior_employment'] ?? '',
      'compliance_background_check' => $meta['compliance_background_check'] ?? '',
      'compliance_age_minimum' => $meta['compliance_age_minimum'] ?? '',
      'resumes' => array_map(function (array $row): array {
        $time = $row['created_at'] ? strtotime($row['created_at']) : time();
        $token = $row['access_token'] ?? '';
        return [
          'id' => (int) $row['id'],
          'name' => $row['file_name'] ?: 'Resume',
          'url' => $token ? "/api/user-file?token={$token}" : '',
          'time' => $time,
          'mime' => $row['mime_type'] ?? '',
          'size' => (int) ($row['file_size'] ?? 0),
        ];
      }, $resumes),
      'cover_letters' => array_map(function (array $row): array {
        $time = $row['created_at'] ? strtotime($row['created_at']) : time();
        $token = $row['access_token'] ?? '';
        return [
          'id' => (int) $row['id'],
          'name' => $row['file_name'] ?: 'Cover Letter',
          'url' => $token ? "/api/user-file?token={$token}" : '',
          'time' => $time,
          'mime' => $row['mime_type'] ?? '',
          'size' => (int) ($row['file_size'] ?? 0),
        ];
      }, $covers),
    ];
  }

  public function update(): array {
    $user = $this->auth->getSessionUser();
    if (empty($user)) {
      http_response_code(403);
      return ['error' => 'Not logged in'];
    }
    $devMode = ($_ENV['DEV_MODE'] ?? '') === '1';
    $debugInfo = $devMode ? [] : null;

    $fields = [
      'first_name', 'last_name', 'dob',
      'street1', 'street2', 'city', 'state', 'zip', 'country',
      'hide_email',
      'avatar_url',
      'compliance_gender', 'compliance_race', 'compliance_disability',
      'compliance_veteran', 'compliance_work_auth', 'compliance_prior_employment',
      'compliance_background_check', 'compliance_age_minimum',
    ];

    foreach ($fields as $field) {
      if (array_key_exists($field, $_POST)) {
        $val = trim((string) $_POST[$field]);
        $this->profiles->setMeta((int) $user['id'], $field, $val);
      }
    }
    // Clear needs_profile flag once user updates profile
    $this->profiles->setMeta((int) $user['id'], 'needs_profile', '0');

    if (isset($_POST['dob']) && $_POST['dob'] !== '') {
      $dob = (string) $_POST['dob'];
      $dobTs = strtotime($dob);
      if ($dobTs !== false) {
        $today = new \DateTimeImmutable('now');
        $dobDate = (new \DateTimeImmutable())->setTimestamp($dobTs);
        $age = (int) $today->diff($dobDate)->y;
        if ($age < 18) {
          http_response_code(422);
          return ['error' => 'You must be at least 18 years old.'];
        }
      }
    }

    // Simple avatar upload handling (optional)
    $avatarUrl = '';
    if (!empty($_POST['avatar_expected']) && empty($_FILES['avatar']['tmp_name'])) {
      if ($devMode) {
        http_response_code(422);
        return [
          'error' => 'Avatar file missing from request.',
          'debug' => [
            'files' => array_keys($_FILES),
            'post' => array_keys($_POST),
          ],
        ];
      }
    }

    if (!empty($_FILES['avatar']['tmp_name'])) {
      $tmp = $_FILES['avatar']['tmp_name'];
      $name = basename($_FILES['avatar']['name'] ?? 'avatar.png');
      $size = (int) ($_FILES['avatar']['size'] ?? 0);
      $maxBytes = 2 * 1024 * 1024;
      if ($size > $maxBytes) {
        http_response_code(413);
        return ['error' => 'Avatar too large (max 2MB).'];
      }
      $ext = strtolower(pathinfo($name, PATHINFO_EXTENSION) ?: 'png');
      $allowedExt = ['png','jpg','jpeg','gif','webp'];
      if (!in_array($ext, $allowedExt, true)) {
        http_response_code(422);
        return ['error' => 'Invalid avatar type. Use PNG, JPG, GIF, or WEBP.'];
      }
      $uploadDir = __DIR__ . '/../../../uploads/avatars';
      if (!is_dir($uploadDir)) {
        @mkdir($uploadDir, 0777, true);
      }
      @chmod($uploadDir, 0777);
      $fileName = 'avatar_' . $user['id'] . '_' . time() . '.' . $ext;
      $dest = $uploadDir . '/' . $fileName;
      $moved = @move_uploaded_file($tmp, $dest);
      if (!$moved) {
        $moved = @copy($tmp, $dest);
        if ($moved) @unlink($tmp);
      }
      if ($moved) {
        @chmod($dest, 0644);
        $avatarUrl = '/uploads/avatars/' . $fileName;
        $this->profiles->setMeta((int) $user['id'], 'avatar_url', $avatarUrl);
        if ($devMode) {
          $debugInfo['dest'] = $dest;
          $debugInfo['file_exists'] = file_exists($dest);
        }
      } else {
        http_response_code(500);
        $lastErr = error_get_last();
        return ['error' => $devMode ? ('Avatar upload failed. tmp=' . $tmp . ' dest=' . $dest . ' perms=' . substr(sprintf('%o', @fileperms($uploadDir)), -4) . ' last=' . json_encode($lastErr)) : 'Avatar upload failed.'];
      }
    }

    if ($devMode) {
      $debugInfo['has_tmp'] = !empty($_FILES['avatar']['tmp_name']);
      $debugInfo['upload_dir'] = $uploadDir ?? null;
      $debugInfo['upload_dir_writable'] = isset($uploadDir) ? is_writable($uploadDir) : null;
    }

    if (!$avatarUrl) {
      $existing = $this->profiles->getMeta((int) $user['id'], ['avatar_url']);
      $avatarUrl = $existing['avatar_url'] ?? '';
    }

    return [
      'success' => true,
      'avatar_url' => $avatarUrl,
      'debug' => $debugInfo,
    ];
  }
}
