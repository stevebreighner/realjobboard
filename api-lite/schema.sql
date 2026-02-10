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

CREATE TABLE IF NOT EXISTS jb_users (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  wp_user_id INT UNSIGNED NULL,
  username VARCHAR(100) NOT NULL,
  email VARCHAR(191) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'employee',
  email_verified TINYINT(1) NOT NULL DEFAULT 0,
  employer_verified TINYINT(1) NOT NULL DEFAULT 0,
  company_name VARCHAR(191) DEFAULT NULL,
  company_email VARCHAR(191) DEFAULT NULL,
  company_site VARCHAR(191) DEFAULT NULL,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uniq_username (username),
  UNIQUE KEY uniq_email (email),
  UNIQUE KEY uniq_wp_user (wp_user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS jb_user_meta (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id INT UNSIGNED NOT NULL,
  meta_key VARCHAR(100) NOT NULL,
  meta_value LONGTEXT NULL,
  PRIMARY KEY (id),
  KEY idx_user (user_id),
  KEY idx_key (meta_key),
  CONSTRAINT fk_user_meta_user FOREIGN KEY (user_id) REFERENCES jb_users(id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS jb_sessions (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id INT UNSIGNED NOT NULL,
  session_id VARCHAR(128) NOT NULL,
  created_at DATETIME NOT NULL,
  expires_at DATETIME NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uniq_session (session_id),
  KEY idx_user (user_id),
  CONSTRAINT fk_sessions_user FOREIGN KEY (user_id) REFERENCES jb_users(id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
