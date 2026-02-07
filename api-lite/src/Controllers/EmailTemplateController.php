<?php
declare(strict_types=1);

namespace App\Controllers;

use App\Services\AuthService;
use App\Models\SettingsModel;

class EmailTemplateController {
  private AuthService $auth;
  private SettingsModel $settings;

  public function __construct() {
    $this->auth = new AuthService($GLOBALS['DB_PDO']);
    $this->settings = new SettingsModel();
  }

  private function requireAdmin(): array {
    $user = $this->auth->getSessionUser();
    if (empty($user)) {
      http_response_code(403);
      return [];
    }
    $role = $user['role'] ?? '';
    if (!in_array($role, ['site_admin','administrator'], true)) {
      http_response_code(403);
      return [];
    }
    return $user;
  }

  private function jsonInput(): array {
    $raw = file_get_contents('php://input');
    $data = json_decode($raw, true);
    return is_array($data) ? $data : [];
  }

  public function publicList(): array {
    $raw = $this->settings->get('email_templates') ?? '[]';
    $templates = json_decode($raw, true);
    return is_array($templates) ? $templates : [];
  }

  public function adminList(): array {
    $admin = $this->requireAdmin();
    if (empty($admin)) return ['error' => 'Access denied'];
    $raw = $this->settings->get('email_templates') ?? '[]';
    $historyRaw = $this->settings->get('email_templates_history') ?? '[]';
    $templates = json_decode($raw, true);
    $history = json_decode($historyRaw, true);
    return [
      'templates' => is_array($templates) ? $templates : [],
      'history' => is_array($history) ? $history : [],
    ];
  }

  public function adminSave(): array {
    $admin = $this->requireAdmin();
    if (empty($admin)) return ['error' => 'Access denied'];
    $data = $this->jsonInput();
    $templates = is_array($data['templates'] ?? null) ? $data['templates'] : [];
    $this->settings->set('email_templates', json_encode($templates));

    $historyRaw = $this->settings->get('email_templates_history') ?? '[]';
    $history = json_decode($historyRaw, true);
    if (!is_array($history)) $history = [];
    $history[] = ['time' => time(), 'templates' => $templates];
    $history = array_slice($history, -10);
    $this->settings->set('email_templates_history', json_encode($history));

    return ['success' => true, 'templates' => $templates, 'history' => $history];
  }
}
