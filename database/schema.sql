-- ==========================================================
-- PIXEL — database schema (MySQL / MariaDB)
-- Import this file once in phpMyAdmin (tab "Import"),
-- or run:  mysql -u root < database/schema.sql
-- ==========================================================

CREATE DATABASE IF NOT EXISTS pixel
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE pixel;

-- Messages sent from the contact form
CREATE TABLE IF NOT EXISTS messages (
  id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  name        VARCHAR(80)  NOT NULL,
  email       VARCHAR(254) NOT NULL,
  project     ENUM('brand', 'uiux', 'web', 'all') NOT NULL,
  message     TEXT         NOT NULL,
  ip_hash     CHAR(64)     NOT NULL,            -- SHA-256 of the visitor's IP (never the raw IP)
  mail_sent   TINYINT(1)   NOT NULL DEFAULT 0,  -- 1 when the notification email was sent
  created_at  DATETIME     NOT NULL,
  PRIMARY KEY (id),
  KEY idx_ip_created (ip_hash, created_at)      -- makes the anti-spam rate limit fast
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- One row per trackable button; "total" is incremented by php/track.php
CREATE TABLE IF NOT EXISTS click_counters (
  button_id   VARCHAR(40)  NOT NULL,
  label       VARCHAR(80)  NOT NULL,
  total       INT UNSIGNED NOT NULL DEFAULT 0,
  last_click  DATETIME     NULL DEFAULT NULL,
  PRIMARY KEY (button_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- The only button ids the server accepts (anything else is rejected)
INSERT IGNORE INTO click_counters (button_id, label) VALUES
  ('nav-talk',       'Header: Let''s talk'),
  ('hero-start',     'Hero: Start a project'),
  ('hero-services',  'Hero: Explore services'),
  ('modal-continue', 'Modal: Continue to the form'),
  ('form-send',      'Form: Send message');
