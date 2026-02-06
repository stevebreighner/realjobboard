-- api-lite/schema.sql
-- Core tables for migrating off WordPress.

CREATE TABLE IF NOT EXISTS jb_jobs (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  wp_post_id INT UNSIGNED NULL,
  title VARCHAR(255) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'publish',
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uniq_wp_post (wp_post_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS jb_job_meta (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  job_id INT UNSIGNED NOT NULL,
  meta_key VARCHAR(100) NOT NULL,
  meta_value LONGTEXT NULL,
  PRIMARY KEY (id),
  KEY idx_job (job_id),
  KEY idx_key (meta_key),
  CONSTRAINT fk_job_meta_job FOREIGN KEY (job_id) REFERENCES jb_jobs(id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
