<?php
declare(strict_types=1);

namespace App\Models;

class CompanyModel {
  public function __construct() {
    $this->ensureSchema();
  }

  private function ensureSchema(): void {
    $pdo = $GLOBALS['DB_PDO'];
    $table = $pdo->query("SHOW TABLES LIKE 'jb_companies'")->fetch();
    if (!$table) {
      $pdo->exec("
        CREATE TABLE IF NOT EXISTS jb_companies (
          id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
          name VARCHAR(191) NOT NULL,
          slug VARCHAR(191) NOT NULL,
          code VARCHAR(64) NOT NULL,
          domain VARCHAR(191) DEFAULT NULL,
          logo_url VARCHAR(255) DEFAULT NULL,
          street1 VARCHAR(191) DEFAULT NULL,
          street2 VARCHAR(191) DEFAULT NULL,
          city VARCHAR(191) DEFAULT NULL,
          state VARCHAR(64) DEFAULT NULL,
          zip VARCHAR(32) DEFAULT NULL,
          country VARCHAR(64) DEFAULT NULL,
          free_post_used TINYINT(1) NOT NULL DEFAULT 0,
          verified TINYINT(1) NOT NULL DEFAULT 0,
          verified_at DATETIME DEFAULT NULL,
          verified_by INT UNSIGNED DEFAULT NULL,
          created_at DATETIME NOT NULL,
          updated_at DATETIME NOT NULL,
          UNIQUE KEY uniq_slug (slug),
          UNIQUE KEY uniq_code (code)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      ");
    } else {
      $columns = $pdo->query("SHOW COLUMNS FROM jb_companies")->fetchAll();
      $existing = array_column($columns ?: [], 'Field');
      if (!in_array('verified', $existing, true)) {
        $pdo->exec("ALTER TABLE jb_companies ADD COLUMN verified TINYINT(1) NOT NULL DEFAULT 0");
      }
      if (!in_array('verified_at', $existing, true)) {
        $pdo->exec("ALTER TABLE jb_companies ADD COLUMN verified_at DATETIME DEFAULT NULL");
      }
      if (!in_array('verified_by', $existing, true)) {
        $pdo->exec("ALTER TABLE jb_companies ADD COLUMN verified_by INT UNSIGNED DEFAULT NULL");
      }
    }

    $memberTable = $pdo->query("SHOW TABLES LIKE 'jb_company_members'")->fetch();
    if (!$memberTable) {
      $pdo->exec("
        CREATE TABLE IF NOT EXISTS jb_company_members (
          id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
          company_id INT UNSIGNED NOT NULL,
          user_id INT UNSIGNED NOT NULL,
          role VARCHAR(32) NOT NULL DEFAULT 'member',
          created_at DATETIME NOT NULL,
          UNIQUE KEY uniq_company_user (company_id, user_id),
          KEY idx_company (company_id),
          KEY idx_user (user_id),
          CONSTRAINT fk_company_members_company FOREIGN KEY (company_id) REFERENCES jb_companies(id) ON DELETE CASCADE,
          CONSTRAINT fk_company_members_user FOREIGN KEY (user_id) REFERENCES jb_users(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      ");
    }
  }
  public function findByName(string $name): ?array {
    $pdo = $GLOBALS['DB_PDO'];
    $stmt = $pdo->prepare("SELECT * FROM jb_companies WHERE name = :name LIMIT 1");
    $stmt->execute([':name' => $name]);
    $row = $stmt->fetch();
    return $row ?: null;
  }

  public function findBySlug(string $slug): ?array {
    $pdo = $GLOBALS['DB_PDO'];
    $stmt = $pdo->prepare("SELECT * FROM jb_companies WHERE slug = :slug LIMIT 1");
    $stmt->execute([':slug' => $slug]);
    $row = $stmt->fetch();
    return $row ?: null;
  }

  public function search(string $query, int $limit = 5): array {
    $pdo = $GLOBALS['DB_PDO'];
    $stmt = $pdo->prepare("SELECT id, name, slug FROM jb_companies WHERE name LIKE :q ORDER BY name ASC LIMIT :limit");
    $stmt->bindValue(':q', '%' . $query . '%');
    $stmt->bindValue(':limit', $limit, \PDO::PARAM_INT);
    $stmt->execute();
    return $stmt->fetchAll();
  }

  public function create(array $data): array {
    $pdo = $GLOBALS['DB_PDO'];
    $now = date('Y-m-d H:i:s');
    $stmt = $pdo->prepare("
      INSERT INTO jb_companies (name, slug, code, domain, logo_url, street1, street2, city, state, zip, country, free_post_used, created_at, updated_at)
      VALUES (:name, :slug, :code, :domain, :logo_url, :street1, :street2, :city, :state, :zip, :country, :free_post_used, :created_at, :updated_at)
    ");
    $stmt->execute([
      ':name' => $data['name'],
      ':slug' => $data['slug'],
      ':code' => $data['code'],
      ':domain' => $data['domain'] ?? null,
      ':logo_url' => $data['logo_url'] ?? null,
      ':street1' => $data['street1'] ?? null,
      ':street2' => $data['street2'] ?? null,
      ':city' => $data['city'] ?? null,
      ':state' => $data['state'] ?? null,
      ':zip' => $data['zip'] ?? null,
      ':country' => $data['country'] ?? null,
      ':free_post_used' => $data['free_post_used'] ?? 0,
      ':created_at' => $now,
      ':updated_at' => $now,
    ]);
    $id = (int) $pdo->lastInsertId();
    return $this->findById($id);
  }

  public function findById(int $id): ?array {
    $pdo = $GLOBALS['DB_PDO'];
    $stmt = $pdo->prepare("SELECT * FROM jb_companies WHERE id = :id LIMIT 1");
    $stmt->execute([':id' => $id]);
    $row = $stmt->fetch();
    return $row ?: null;
  }

  public function markFreeUsed(int $companyId): void {
    $pdo = $GLOBALS['DB_PDO'];
    $stmt = $pdo->prepare("UPDATE jb_companies SET free_post_used = 1, updated_at = :now WHERE id = :id");
    $stmt->execute([':id' => $companyId, ':now' => date('Y-m-d H:i:s')]);
  }

  public function setVerified(int $companyId, bool $verified, ?int $byUserId = null): void {
    $pdo = $GLOBALS['DB_PDO'];
    $stmt = $pdo->prepare("
      UPDATE jb_companies
      SET verified = :verified,
          verified_at = :verified_at,
          verified_by = :verified_by,
          updated_at = :updated_at
      WHERE id = :id
    ");
    $stmt->execute([
      ':verified' => $verified ? 1 : 0,
      ':verified_at' => $verified ? date('Y-m-d H:i:s') : null,
      ':verified_by' => $verified ? $byUserId : null,
      ':updated_at' => date('Y-m-d H:i:s'),
      ':id' => $companyId,
    ]);
  }

  public function listMembers(int $companyId): array {
    $pdo = $GLOBALS['DB_PDO'];
    $stmt = $pdo->prepare("
      SELECT m.user_id, m.role, u.username, u.email, u.role AS user_role
      FROM jb_company_members m
      JOIN jb_users u ON u.id = m.user_id
      WHERE m.company_id = :id
      ORDER BY m.role ASC, u.username ASC
    ");
    $stmt->execute([':id' => $companyId]);
    return $stmt->fetchAll() ?: [];
  }

  public function getMemberRole(int $companyId, int $userId): ?string {
    $pdo = $GLOBALS['DB_PDO'];
    $stmt = $pdo->prepare("SELECT role FROM jb_company_members WHERE company_id = :cid AND user_id = :uid LIMIT 1");
    $stmt->execute([':cid' => $companyId, ':uid' => $userId]);
    $row = $stmt->fetch();
    return $row['role'] ?? null;
  }

  public function setMemberRole(int $companyId, int $userId, string $role): void {
    $pdo = $GLOBALS['DB_PDO'];
    $stmt = $pdo->prepare("
      INSERT INTO jb_company_members (company_id, user_id, role, created_at)
      VALUES (:company_id, :user_id, :role, :created_at)
      ON DUPLICATE KEY UPDATE role = VALUES(role)
    ");
    $stmt->execute([
      ':company_id' => $companyId,
      ':user_id' => $userId,
      ':role' => $role,
      ':created_at' => date('Y-m-d H:i:s'),
    ]);
  }

  public function removeMember(int $companyId, int $userId): void {
    $pdo = $GLOBALS['DB_PDO'];
    $stmt = $pdo->prepare("DELETE FROM jb_company_members WHERE company_id = :cid AND user_id = :uid");
    $stmt->execute([':cid' => $companyId, ':uid' => $userId]);
  }

  public function addMember(int $companyId, int $userId, string $role = 'member'): void {
    $pdo = $GLOBALS['DB_PDO'];
    $stmt = $pdo->prepare("INSERT IGNORE INTO jb_company_members (company_id, user_id, role, created_at) VALUES (:company_id, :user_id, :role, :created_at)");
    $stmt->execute([
      ':company_id' => $companyId,
      ':user_id' => $userId,
      ':role' => $role,
      ':created_at' => date('Y-m-d H:i:s'),
    ]);
  }

  public function update(int $companyId, array $data): void {
    $pdo = $GLOBALS['DB_PDO'];
    $fields = [];
    $params = [':id' => $companyId, ':updated_at' => date('Y-m-d H:i:s')];
    $allowed = ['name','slug','logo_url','street1','street2','city','state','zip','country','domain'];
    foreach ($allowed as $key) {
      if (array_key_exists($key, $data)) {
        $fields[] = "{$key} = :{$key}";
        $params[":{$key}"] = $data[$key];
      }
    }
    if (!$fields) return;
    $sql = "UPDATE jb_companies SET " . implode(', ', $fields) . ", updated_at = :updated_at WHERE id = :id";
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
  }

  public function generateCode(): string {
    return strtoupper(bin2hex(random_bytes(4)));
  }

  public function slugify(string $name): string {
    $slug = strtolower(trim($name));
    $slug = preg_replace('/[^a-z0-9]+/i', '-', $slug);
    $slug = trim($slug ?? '', '-');
    return $slug ?: 'company-' . bin2hex(random_bytes(3));
  }
}
