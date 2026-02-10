<?php
declare(strict_types=1);

namespace App\Controllers;

use App\Models\CompanyModel;
use App\Models\JobModel;
use App\Services\AuthService;
use App\Models\UserMetaModel;
use App\Services\RateLimiter;

class CompanyController {
  private CompanyModel $companies;
  private JobModel $jobs;
  private AuthService $auth;
  private UserMetaModel $userMeta;

  public function __construct() {
    $this->companies = new CompanyModel();
    $this->jobs = new JobModel();
    $this->auth = new AuthService($GLOBALS['DB_PDO']);
    $this->userMeta = new UserMetaModel();
  }

  public function search(): array {
    $query = trim((string) ($_GET['query'] ?? ''));
    if ($query === '') return [];
    return $this->companies->search($query, 8);
  }

  public function show(): array {
    $slug = trim((string) ($_GET['slug'] ?? ''));
    if ($slug === '') {
      http_response_code(422);
      return ['error' => 'Missing slug'];
    }
    $company = $this->companies->findBySlug($slug);
    if (!$company) {
      http_response_code(404);
      return ['error' => 'Company not found'];
    }

    // For now, surface jobs by company name match in meta (simple)
    $jobs = array_filter($this->jobs->list(200), function ($job) use ($company) {
      $metaCompany = $job['meta']['company'] ?? '';
      return $metaCompany && strtolower($metaCompany) === strtolower($company['name']);
    });

    return [
      'company' => [
        'id' => $company['id'],
        'name' => $company['name'],
        'slug' => $company['slug'],
        'logo_url' => $company['logo_url'],
        'verified' => (int) ($company['verified'] ?? 0),
        'street1' => $company['street1'],
        'street2' => $company['street2'],
        'city' => $company['city'],
        'state' => $company['state'],
        'zip' => $company['zip'],
        'country' => $company['country'],
      ],
      'jobs' => array_values($jobs),
    ];
  }

  public function owner(): array {
    $user = $this->auth->getSessionUser();
    if (empty($user)) {
      http_response_code(403);
      return ['error' => 'Not logged in'];
    }
    $companyId = (int) ($this->userMeta->getMeta((int) $user['id'], 'company_id') ?? 0);
    if (!$companyId) {
      return ['company' => null];
    }
    $company = $this->companies->findById($companyId);
    if (!$company) {
      return ['company' => null];
    }
    return ['company' => $company];
  }

  public function updateOwner(): array {
    $ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
    $limiter = new RateLimiter($GLOBALS['DB_PDO']);
    if (!$limiter->check("company-update:{$ip}", 10, 300)) {
      http_response_code(429);
      return ['error' => 'Too many requests. Please try again later.'];
    }
    $user = $this->auth->getSessionUser();
    if (empty($user)) {
      http_response_code(403);
      return ['error' => 'Not logged in'];
    }
    $companyId = (int) ($this->userMeta->getMeta((int) $user['id'], 'company_id') ?? 0);
    if (!$companyId) {
      http_response_code(404);
      return ['error' => 'Company not found'];
    }
    $company = $this->companies->findById($companyId);
    if (!$company) {
      http_response_code(404);
      return ['error' => 'Company not found'];
    }
    $role = $user['role'] ?? '';
    $isAdmin = in_array($role, ['site_admin', 'administrator'], true);
    if (!$isAdmin) {
      if ((int) ($company['verified'] ?? 0) !== 1) {
        http_response_code(403);
        return ['error' => 'Company not verified'];
      }
      $memberRole = $this->companies->getMemberRole($companyId, (int) $user['id']);
      if (!in_array($memberRole, ['owner', 'editor'], true)) {
        http_response_code(403);
        return ['error' => 'Not authorized'];
      }
    }
    $raw = file_get_contents('php://input');
    $data = json_decode($raw, true);
    if (!is_array($data)) $data = [];
    $update = [
      'logo_url' => $data['logo_url'] ?? null,
      'street1' => $data['street1'] ?? null,
      'street2' => $data['street2'] ?? null,
      'city' => $data['city'] ?? null,
      'state' => $data['state'] ?? null,
      'zip' => $data['zip'] ?? null,
      'country' => $data['country'] ?? null,
    ];
    $this->companies->update($companyId, $update);
    $company = $this->companies->findById($companyId);
    return ['company' => $company];
  }

  public function linkCompany(): array {
    $user = $this->auth->getSessionUser();
    if (empty($user)) {
      http_response_code(403);
      return ['error' => 'Not logged in'];
    }
    $role = $user['role'] ?? '';
    if (!in_array($role, ['employer', 'site_admin', 'administrator'], true)) {
      http_response_code(403);
      return ['error' => 'Employer access required'];
    }
    $raw = file_get_contents('php://input');
    $data = json_decode($raw, true);
    if (!is_array($data)) $data = [];
    $name = trim((string) ($data['company'] ?? $data['name'] ?? ''));
    if (!$name) {
      http_response_code(422);
      return ['error' => 'Company name required'];
    }
    $site = trim((string) ($data['company_site'] ?? $data['site'] ?? ''));
    $email = trim((string) ($data['company_email'] ?? $data['email'] ?? ''));
    $logo = trim((string) ($data['logo_url'] ?? ''));

    $domain = '';
    if ($email && strpos($email, '@') !== false) {
      $domain = explode('@', $email)[1] ?? '';
    } elseif ($site) {
      $host = parse_url($site, PHP_URL_HOST);
      $domain = $host ? preg_replace('/^www\\./', '', $host) : '';
    }

    $company = $this->companies->findByName($name);
    if (!$company) {
      $company = $this->companies->create([
        'name' => $name,
        'slug' => $this->companies->slugify($name),
        'code' => $this->companies->generateCode(),
        'domain' => $domain ?: null,
        'logo_url' => $logo ?: null,
        'street1' => $data['street1'] ?? null,
        'street2' => $data['street2'] ?? null,
        'city' => $data['city'] ?? null,
        'state' => $data['state'] ?? null,
        'zip' => $data['zip'] ?? null,
        'country' => $data['country'] ?? null,
      ]);
    } else {
      $this->companies->update((int) $company['id'], [
        'logo_url' => $logo ?: ($company['logo_url'] ?? null),
        'street1' => $data['street1'] ?? $company['street1'] ?? null,
        'street2' => $data['street2'] ?? $company['street2'] ?? null,
        'city' => $data['city'] ?? $company['city'] ?? null,
        'state' => $data['state'] ?? $company['state'] ?? null,
        'zip' => $data['zip'] ?? $company['zip'] ?? null,
        'country' => $data['country'] ?? $company['country'] ?? null,
        'domain' => $domain ?: ($company['domain'] ?? null),
      ]);
      $company = $this->companies->findById((int) $company['id']);
    }

    if ($company) {
      $this->userMeta->setMeta((int) $user['id'], 'company_id', (string) $company['id']);
      $this->userMeta->setMeta((int) $user['id'], 'company_code', (string) $company['code']);
      $this->userMeta->setMeta((int) $user['id'], 'company_name', (string) $company['name']);
      $this->companies->addMember((int) $company['id'], (int) $user['id'], 'owner');
    }

    // Update user table with company info for reference
    $pdo = $GLOBALS['DB_PDO'];
    $stmt = $pdo->prepare("UPDATE jb_users SET company_name = :name, company_email = :email, company_site = :site, updated_at = :now WHERE id = :id");
    $stmt->execute([
      ':name' => $name,
      ':email' => $email ?: null,
      ':site' => $site ?: null,
      ':now' => date('Y-m-d H:i:s'),
      ':id' => (int) $user['id'],
    ]);

    return ['company' => $company];
  }
}
