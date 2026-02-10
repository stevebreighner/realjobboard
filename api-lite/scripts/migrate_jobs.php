<?php
declare(strict_types=1);

// Usage: php api-lite/scripts/migrate_jobs.php
require __DIR__ . '/../src/bootstrap.php';

$pdo = $GLOBALS['DB_PDO'];

function tableExists(PDO $pdo, string $table): bool {
  $stmt = $pdo->prepare('SHOW TABLES LIKE :t');
  $stmt->execute([':t' => $table]);
  return (bool) $stmt->fetchColumn();
}

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

$countStmt = $pdo->query("SELECT COUNT(*) FROM jb_jobs");
$existing = (int) $countStmt->fetchColumn();

// Pull jobs from WP posts
$prefix = $GLOBALS['DB_PREFIX'] ?? 'wp_';

$posts = $pdo->query("SELECT ID, post_title, post_status, post_date, post_modified 
                      FROM {$prefix}posts 
                      WHERE post_type IN ('post','job') AND post_status IN ('publish','draft')
                      ORDER BY post_date DESC")->fetchAll();

$insertJob = $pdo->prepare("INSERT INTO jb_jobs (wp_post_id, title, status, created_at, updated_at)
                            VALUES (:wp_id, :title, :status, :created_at, :updated_at)
                            ON DUPLICATE KEY UPDATE 
                              title=VALUES(title),
                              status=VALUES(status),
                              created_at=VALUES(created_at),
                              updated_at=VALUES(updated_at)");

$insertMeta = $pdo->prepare("INSERT INTO jb_job_meta (job_id, meta_key, meta_value)
                             VALUES (:job_id, :meta_key, :meta_value)");

$metaKeys = [
  'company','city','state','zip','country','field','rate_type','rate_min','rate_max',
  'street1','street2','company_email','company_site','company_name'
];

foreach ($posts as $post) {
  $insertJob->execute([
    ':wp_id' => $post['ID'],
    ':title' => $post['post_title'] ?: 'Untitled',
    ':status' => $post['post_status'],
    ':created_at' => $post['post_date'],
    ':updated_at' => $post['post_modified'],
  ]);

  $jobId = (int) $pdo->query("SELECT id FROM jb_jobs WHERE wp_post_id = " . (int)$post['ID'])->fetchColumn();
  if (!$jobId) {
    continue;
  }

  // Clear existing meta for this job (idempotent)
  $pdo->prepare("DELETE FROM jb_job_meta WHERE job_id = :job_id")->execute([':job_id' => $jobId]);

  $metaStmt = $pdo->prepare("SELECT meta_key, meta_value FROM {$prefix}postmeta WHERE post_id = ? AND meta_key IN (" .
    implode(',', array_fill(0, count($metaKeys), '?')) . ")");
  $metaStmt->execute(array_merge([$post['ID']], $metaKeys));
  $rows = $metaStmt->fetchAll();
  foreach ($rows as $row) {
    $insertMeta->execute([
      ':job_id' => $jobId,
      ':meta_key' => $row['meta_key'],
      ':meta_value' => $row['meta_value'],
    ]);
  }
}

$finalCount = (int) $pdo->query("SELECT COUNT(*) FROM jb_jobs")->fetchColumn();

echo "Migrated jobs. Before: {$existing} After: {$finalCount}\n";
