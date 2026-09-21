<?php
/**
 * Database bootstrap. Reads config.php (falling back to config.sample.php only
 * so the file structure is known if config.php is missing) and returns a
 * configured PDO instance.
 *
 * Supported drivers:
 *   - 'mysql'  : production default on Hostinger (utf8mb4).
 *   - 'sqlite' : local testing only, so endpoints can be exercised without a
 *                MySQL server.
 */

/** Load and return the config array. */
function load_config(): array
{
    static $config = null;
    if ($config !== null) {
        return $config;
    }

    $configPath = __DIR__ . '/../config.php';
    $samplePath = __DIR__ . '/../config.sample.php';

    if (is_file($configPath)) {
        $config = require $configPath;
    } elseif (is_file($samplePath)) {
        // Fall back to the sample only for structure; it has no real password.
        $config = require $samplePath;
    } else {
        throw new RuntimeException('Missing api/config.php');
    }

    if (!is_array($config)) {
        throw new RuntimeException('config.php must return an array');
    }

    return $config;
}

/** Return a shared PDO instance built from the active config. */
function get_db(): PDO
{
    static $pdo = null;
    if ($pdo instanceof PDO) {
        return $pdo;
    }

    $config = load_config();
    $driver = $config['driver'] ?? 'mysql';

    if ($driver === 'sqlite') {
        $path = $config['sqlite_path'] ?? (__DIR__ . '/../.data/magicframes.sqlite');
        $dir = dirname($path);
        if (!is_dir($dir)) {
            @mkdir($dir, 0775, true);
        }
        $dsn = 'sqlite:' . $path;
        $pdo = new PDO($dsn, null, null, [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES   => false,
        ]);
        $pdo->exec('PRAGMA foreign_keys = ON');
        return $pdo;
    }

    // Default: MySQL.
    $host    = $config['host'] ?? '127.0.0.1';
    $dbname  = $config['dbname'] ?? '';
    $charset = $config['charset'] ?? 'utf8mb4';
    $port    = $config['port'] ?? 3306;

    $dsn = sprintf('mysql:host=%s;port=%d;dbname=%s;charset=%s', $host, $port, $dbname, $charset);

    $pdo = new PDO($dsn, $config['user'] ?? '', $config['password'] ?? '', [
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES   => false,
    ]);

    return $pdo;
}
