<?php
declare(strict_types=1);

namespace App\Models;

class JobModel {
  private function tableExists(string $table): bool {
    $pdo = $GLOBALS['DB_PDO'];
    $stmt = $pdo->prepare('SHOW TABLES LIKE :t');
    $stmt->execute([':t' => $table]);
    return (bool) $stmt->fetchColumn();
  }

  public function list(int $limit = 50): array {
    $pdo = $GLOBALS['DB_PDO'];
    $prefix = $GLOBALS['DB_PREFIX'] ?? 'wp_';
    $jobsTable = "{$prefix}jobs";
    $results = [];
    if ($this->tableExists($jobsTable)) {
      $sql = "SELECT id, title, description, location, company, salary_range, job_type, created_at
              FROM {$jobsTable}
              ORDER BY created_at DESC
              LIMIT :limit";
      $stmt = $pdo->prepare($sql);
      $stmt->bindValue(':limit', $limit, \PDO::PARAM_INT);
      $stmt->execute();
      $rows = $stmt->fetchAll();
      if (!empty($rows)) {
        $results = array_map([$this, 'mapJobRow'], $rows);
      }
    }

    if ($this->tableExists('jb_jobs')) {
      $sql = "SELECT id, title, created_at
              FROM jb_jobs
              WHERE status = 'publish'
              ORDER BY created_at DESC
              LIMIT :limit";
      $stmt = $pdo->prepare($sql);
      $stmt->bindValue(':limit', $limit, \PDO::PARAM_INT);
      $stmt->execute();
      $rows = $stmt->fetchAll();
      if (!empty($rows)) {
        $jbJobs = array_map(function (array $row): array {
          return [
            'id' => (int) $row['id'],
            'title' => $row['title'] ?? '',
            'description' => '',
            'date' => $row['created_at'] ?? '',
            'meta' => [],
            '_source' => 'jb',
          ];
        }, $rows);
        $jbJobs = $this->hydrateMeta($jbJobs);
        $results = array_merge($jbJobs, $results);
      }
    }

    $postsTable = "{$prefix}posts";
    if ($this->tableExists($postsTable)) {
      $sql = "SELECT ID, post_title, post_content, post_date
              FROM {$postsTable}
              WHERE post_type IN ('post','job') AND post_status = 'publish'
              ORDER BY post_date DESC
              LIMIT :limit";
      $stmt = $pdo->prepare($sql);
      $stmt->bindValue(':limit', $limit, \PDO::PARAM_INT);
      $stmt->execute();
      $rows = $stmt->fetchAll();
      $posts = array_map(function (array $row): array {
        return [
          'id' => (int) $row['ID'],
          'title' => $row['post_title'] ?? '',
          'description' => $row['post_content'] ?? '',
          'date' => $row['post_date'] ?? '',
          'meta' => [],
        ];
      }, $rows);
      return array_merge($results, $posts);
    }
    return $results;
  }

  public function listByOwner(int $userId): array {
    $pdo = $GLOBALS['DB_PDO'];
    if (!$this->tableExists('jb_jobs')) return [];
    $stmt = $pdo->prepare("
      SELECT j.id, j.title, j.created_at
      FROM jb_jobs j
      JOIN jb_job_meta m ON m.job_id = j.id AND m.meta_key = 'owner_id' AND m.meta_value = :uid
      ORDER BY j.created_at DESC
    ");
    $stmt->execute([':uid' => (string) $userId]);
    $rows = $stmt->fetchAll() ?: [];
    $jobs = array_map(function (array $row): array {
      return [
        'id' => (int) $row['id'],
        'title' => $row['title'] ?? '',
        'description' => '',
        'date' => $row['created_at'] ?? '',
        'meta' => [],
        '_source' => 'jb',
      ];
    }, $rows);
    return $this->hydrateMeta($jobs);
  }

  public function listByCompanyId(int $companyId): array {
    $pdo = $GLOBALS['DB_PDO'];
    if (!$this->tableExists('jb_jobs')) return [];
    $stmt = $pdo->prepare("
      SELECT j.id, j.title, j.created_at
      FROM jb_jobs j
      JOIN jb_job_meta m ON m.job_id = j.id AND m.meta_key = 'company_id' AND m.meta_value = :cid
      ORDER BY j.created_at DESC
    ");
    $stmt->execute([':cid' => (string) $companyId]);
    $rows = $stmt->fetchAll() ?: [];
    $jobs = array_map(function (array $row): array {
      return [
        'id' => (int) $row['id'],
        'title' => $row['title'] ?? '',
        'description' => '',
        'date' => $row['created_at'] ?? '',
        'meta' => [],
        '_source' => 'jb',
      ];
    }, $rows);
    return $this->hydrateMeta($jobs);
  }

  public function listByCompanyName(string $name): array {
    $pdo = $GLOBALS['DB_PDO'];
    if (!$this->tableExists('jb_jobs')) return [];
    $stmt = $pdo->prepare("
      SELECT j.id, j.title, j.created_at
      FROM jb_jobs j
      JOIN jb_job_meta m ON m.job_id = j.id AND m.meta_key = 'company' AND m.meta_value = :name
      ORDER BY j.created_at DESC
    ");
    $stmt->execute([':name' => $name]);
    $rows = $stmt->fetchAll() ?: [];
    $jobs = array_map(function (array $row): array {
      return [
        'id' => (int) $row['id'],
        'title' => $row['title'] ?? '',
        'description' => '',
        'date' => $row['created_at'] ?? '',
        'meta' => [],
        '_source' => 'jb',
      ];
    }, $rows);
    return $this->hydrateMeta($jobs);
  }

  public function updateJob(int $jobId, string $title, string $status): void {
    $pdo = $GLOBALS['DB_PDO'];
    $stmt = $pdo->prepare("UPDATE jb_jobs SET title = :title, status = :status, updated_at = :now WHERE id = :id");
    $stmt->execute([
      ':title' => $title,
      ':status' => $status,
      ':now' => date('Y-m-d H:i:s'),
      ':id' => $jobId,
    ]);
  }

  public function updateMeta(int $jobId, array $meta): void {
    if (empty($meta)) return;
    $pdo = $GLOBALS['DB_PDO'];
    foreach ($meta as $key => $value) {
      $stmt = $pdo->prepare("SELECT id FROM jb_job_meta WHERE job_id = :job_id AND meta_key = :key LIMIT 1");
      $stmt->execute([':job_id' => $jobId, ':key' => $key]);
      $id = $stmt->fetchColumn();
      if ($id) {
        $upd = $pdo->prepare("UPDATE jb_job_meta SET meta_value = :val WHERE id = :id");
        $upd->execute([':val' => $value, ':id' => $id]);
      } else {
        $ins = $pdo->prepare("INSERT INTO jb_job_meta (job_id, meta_key, meta_value) VALUES (:job_id, :key, :val)");
        $ins->execute([':job_id' => $jobId, ':key' => $key, ':val' => $value]);
      }
    }
  }

  public function deleteJob(int $jobId): void {
    $pdo = $GLOBALS['DB_PDO'];
    $stmt = $pdo->prepare("DELETE FROM jb_jobs WHERE id = :id");
    $stmt->execute([':id' => $jobId]);
  }

  public function getById(int $id): array {
    $pdo = $GLOBALS['DB_PDO'];
    $prefix = $GLOBALS['DB_PREFIX'] ?? 'wp_';
    if ($this->tableExists('jb_jobs')) {
      $sql = "SELECT id, title, created_at, status
              FROM jb_jobs
              WHERE id = :id
              LIMIT 1";
      $stmt = $pdo->prepare($sql);
      $stmt->execute([':id' => $id]);
      $row = $stmt->fetch();
      if ($row) {
        $job = [
          'id' => (int) $row['id'],
          'title' => $row['title'] ?? '',
          'description' => '',
          'date' => $row['created_at'] ?? '',
          'meta' => [],
          '_source' => 'jb',
        ];
        $withMeta = $this->hydrateMeta([$job]);
        return $withMeta[0] ?? $job;
      }
    }
    $jobsTable = "{$prefix}jobs";
    if ($this->tableExists($jobsTable)) {
      $sql = "SELECT id, title, description, location, company, salary_range, job_type, created_at
              FROM {$jobsTable}
              WHERE id = :id
              LIMIT 1";
      $stmt = $pdo->prepare($sql);
      $stmt->execute([':id' => $id]);
      $row = $stmt->fetch();
      if ($row) {
        return $this->mapJobRow($row);
      }
    }

    if ($this->tableExists('jb_jobs')) {
      $sql = "SELECT id, title, created_at
              FROM jb_jobs
              WHERE id = :id
              LIMIT 1";
      $stmt = $pdo->prepare($sql);
      $stmt->execute([':id' => $id]);
      $row = $stmt->fetch();
      if ($row) {
        return [
          'id' => (int) $row['id'],
          'title' => $row['title'] ?? '',
          'description' => '',
          'date' => $row['created_at'] ?? '',
          'meta' => [],
        ];
      }
    }

    $postsTable = "{$prefix}posts";
    if ($this->tableExists($postsTable)) {
      $sql = "SELECT ID, post_title, post_content, post_date
              FROM {$postsTable}
              WHERE ID = :id
              LIMIT 1";
      $stmt = $pdo->prepare($sql);
      $stmt->execute([':id' => $id]);
      $row = $stmt->fetch();
      if ($row) {
        return [
          'id' => (int) $row['ID'],
          'title' => $row['post_title'] ?? '',
          'description' => $row['post_content'] ?? '',
          'date' => $row['post_date'] ?? '',
          'meta' => [],
        ];
      }
    }

    return [];
  }

  private function mapJobRow(array $row): array {
    return [
      'id' => (int) $row['id'],
      'title' => $row['title'] ?? '',
      'description' => $row['description'] ?? '',
      'date' => $row['created_at'] ?? '',
      'meta' => [
        'company' => $row['company'] ?? '',
        'location' => $row['location'] ?? '',
        'salary_range' => $row['salary_range'] ?? '',
        'job_type' => $row['job_type'] ?? '',
      ],
    ];
  }

  public function createDraft(string $title, array $meta = [], string $status = 'draft'): int {
    $pdo = $GLOBALS['DB_PDO'];
    $now = date('Y-m-d H:i:s');
    $stmt = $pdo->prepare("
      INSERT INTO jb_jobs (title, status, created_at, updated_at)
      VALUES (:title, :status, :created_at, :updated_at)
    ");
    $stmt->execute([
      ':title' => $title,
      ':status' => $status,
      ':created_at' => $now,
      ':updated_at' => $now,
    ]);
    $jobId = (int) $pdo->lastInsertId();
    $this->storeMeta($jobId, $meta);
    return $jobId;
  }

  public function storeMeta(int $jobId, array $meta): void {
    if (empty($meta)) return;
    $pdo = $GLOBALS['DB_PDO'];
    $stmt = $pdo->prepare("INSERT INTO jb_job_meta (job_id, meta_key, meta_value) VALUES (:job_id, :meta_key, :meta_value)");
    foreach ($meta as $key => $value) {
      $stmt->execute([
        ':job_id' => $jobId,
        ':meta_key' => $key,
        ':meta_value' => $value,
      ]);
    }
  }

  private function hydrateMeta(array $jobs): array {
    if (empty($jobs)) return $jobs;
    $pdo = $GLOBALS['DB_PDO'];
    $ids = array_map(fn($j) => (int) $j['id'], $jobs);
    $placeholders = implode(',', array_fill(0, count($ids), '?'));
    $stmt = $pdo->prepare("SELECT job_id, meta_key, meta_value FROM jb_job_meta WHERE job_id IN ({$placeholders})");
    $stmt->execute($ids);
    $metaRows = $stmt->fetchAll();
    $metaByJob = [];
    foreach ($metaRows as $row) {
      $metaByJob[$row['job_id']][$row['meta_key']] = $row['meta_value'];
    }
    return array_map(function ($job) use ($metaByJob) {
      $jobId = (int) $job['id'];
      $meta = $metaByJob[$jobId] ?? [];
      $job['meta'] = array_merge($job['meta'] ?? [], $meta);
      if (!empty($meta['description']) && empty($job['description'])) {
        $job['description'] = $meta['description'];
      }
      if (!empty($meta['summary']) && empty($job['summary'])) {
        $job['summary'] = $meta['summary'];
      }
      return $job;
    }, $jobs);
  }
}
