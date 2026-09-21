-- MagicFrames — MySQL schema (converted from supabase/schema.sql)
-- ---------------------------------------------------------------------------
-- Target: Hostinger MySQL (MariaDB/MySQL, utf8mb4). Import this once via SSH:
--
--     mysql -u <user> -p <dbname> < api/schema.sql
--
-- or paste it into phpMyAdmin (Database -> SQL). Access control is enforced
-- in PHP (session auth), NOT via database policies, so there is no Postgres
-- RLS here.
--
-- Row IDs are 36-char UUIDv4 strings generated in PHP (see api/lib/uuid.php),
-- not by a database default, so MySQL and the local sqlite test driver behave
-- identically.
--
-- Column mapping (snake_case in DB  ->  camelCase in lib/types.ts):
--   gallery_images: id, title, src, width, height, alt
--   gallery_videos: id, title, provider, video_id->videoId,
--                   thumbnail_width->thumbnailWidth,
--                   thumbnail_height->thumbnailHeight
--   projects:       id, title, description, cover_src->coverSrc,
--                   cover_width->coverWidth, cover_height->coverHeight, date
-- ---------------------------------------------------------------------------

SET NAMES utf8mb4;

-- Image gallery. Maps to GalleryImage { id, title, src, width, height, alt }.
CREATE TABLE IF NOT EXISTS gallery_images (
  id         CHAR(36)     NOT NULL PRIMARY KEY,
  title      VARCHAR(255) NOT NULL DEFAULT '',
  src        TEXT         NOT NULL,
  width      INT          NOT NULL,
  height     INT          NOT NULL,
  alt        VARCHAR(500) NOT NULL DEFAULT '',
  created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Video gallery. Maps to GalleryVideo
-- { id, title, provider, videoId, thumbnailWidth, thumbnailHeight }.
CREATE TABLE IF NOT EXISTS gallery_videos (
  id               CHAR(36)                    NOT NULL PRIMARY KEY,
  title            VARCHAR(255)                NOT NULL DEFAULT '',
  provider         ENUM('youtube', 'vimeo')    NOT NULL,
  video_id         VARCHAR(255)                NOT NULL,
  thumbnail_width  INT                         NOT NULL,
  thumbnail_height INT                         NOT NULL,
  created_at       TIMESTAMP(6)                NOT NULL DEFAULT CURRENT_TIMESTAMP(6)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Latest projects. Maps to Project
-- { id, title, description, coverSrc, coverWidth, coverHeight, date }.
CREATE TABLE IF NOT EXISTS projects (
  id           CHAR(36)     NOT NULL PRIMARY KEY,
  title        VARCHAR(255) NOT NULL DEFAULT '',
  description  TEXT         NOT NULL,
  cover_src    TEXT         NOT NULL,
  cover_width  INT          NOT NULL,
  cover_height INT          NOT NULL,
  date         VARCHAR(64)  NOT NULL DEFAULT '',
  created_at   TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Admin users for the /admin dashboard login. Passwords are stored as bcrypt
-- hashes produced by PHP's password_hash(); never store plaintext.
CREATE TABLE IF NOT EXISTS admin_users (
  id            CHAR(36)     NOT NULL PRIMARY KEY,
  username      VARCHAR(191) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  created_at    TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Failed sign-in counter used by api/lib/throttle.php to lock out brute-force
-- attempts. Rows are keyed on "username|ip" and deleted on a successful login.
CREATE TABLE IF NOT EXISTS login_attempts (
  attempt_key  VARCHAR(255) NOT NULL PRIMARY KEY,
  attempts     INT          NOT NULL DEFAULT 0,
  last_attempt TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- Creating the first admin user
-- ---------------------------------------------------------------------------
-- Recommended (from SSH, never pastes a password into chat or SQL history):
--
--     php api/setup_admin.php <username> <password>
--
-- Manual alternative: generate a bcrypt hash, then insert it. Generate a hash
-- with PHP on the server:
--
--     php -r "echo password_hash('YOUR_PASSWORD', PASSWORD_DEFAULT), PHP_EOL;"
--
-- Then insert (replace the UUID and hash; use UUID() or any 36-char value):
--
--     INSERT INTO admin_users (id, username, password_hash)
--     VALUES (UUID(), 'admin', '$2y$10$REPLACE_WITH_GENERATED_HASH');
