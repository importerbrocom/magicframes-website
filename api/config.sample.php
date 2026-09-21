<?php
/**
 * MagicFrames API configuration — SAMPLE.
 * ---------------------------------------------------------------------------
 * DEPLOY STEP: On your Hostinger server, copy this file to `config.php`
 * (in the same api/ folder) and fill in your real MySQL credentials there:
 *
 *     cp config.sample.php config.php
 *     nano config.php   # set 'password' (and 'dbname'/'user' if different)
 *
 * `config.php` is gitignored and must NEVER be committed. This sample file
 * contains NO real credentials. Do not put your password here.
 *
 * The static site, this api/ folder, and the uploads/ folder all live under
 * your document root (the "mabsite" folder). Deploy layout:
 *
 *     mabsite/
 *       index.html            (from out/)
 *       admin/index.html      (from out/)
 *       _next/ ...            (from out/)
 *       api/                  (this folder)
 *         config.php          (you create it from this sample)
 *       uploads/              (created automatically on first upload)
 *
 * The API is served same-origin at /api/ so the browser never needs CORS and
 * never sees the database credentials.
 */

return [
    // Database driver: 'mysql' for Hostinger production, 'sqlite' for local
    // testing only. Keep 'mysql' on the server.
    'driver'   => 'mysql',

    // ---- MySQL settings (used when driver = 'mysql') ----
    'host'     => '127.0.0.1',
    'dbname'   => 'magicframes',
    'user'     => 'magicframes',
    // Leave blank here. Set your real password ONLY in config.php on the server.
    'password' => '',
    'charset'  => 'utf8mb4',
    'port'     => 3306,

    // ---- SQLite settings (used only when driver = 'sqlite', for local tests) ----
    // Absolute or relative path to the sqlite database file.
    'sqlite_path' => __DIR__ . '/../.data/magicframes.sqlite',

    // ---- Uploads ----
    // Filesystem directory where uploaded images are stored. It MUST live
    // outside api/ so uploaded files are publicly served (and so PHP files
    // cannot be executed from it). Default: the uploads/ folder next to api/.
    'uploads_dir' => __DIR__ . '/../uploads',
    // Public URL base that maps to uploads_dir. With the deploy layout above
    // the uploads/ folder is served at /uploads.
    'uploads_url' => '/uploads',
    // Max upload size in bytes (8 MB default).
    'max_upload_bytes' => 8 * 1024 * 1024,

    // ---- CORS (optional) ----
    // The API is same-origin, so CORS is normally unnecessary. Leave empty.
    // If you must allow a different origin, list it here, e.g.
    // ['https://staging.example.com'].
    'allowed_origins' => [],
];
