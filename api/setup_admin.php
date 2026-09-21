<?php
/**
 * One-time admin user setup — COMMAND LINE ONLY.
 *
 * Usage (over SSH on your Hostinger account, from the folder above api/):
 *
 *     php api/setup_admin.php <username> <password>
 *
 * Example:
 *
 *     php api/setup_admin.php admin 'my-strong-passphrase'
 *
 * Creates the admin user, or updates the password if that username already
 * exists. The password is stored only as a bcrypt hash (password_hash) — the
 * plaintext is never written to the database.
 *
 * Tips
 *  - Wrap the password in single quotes so the shell does not interpret $ or !.
 *  - Afterwards, clear your shell history if you would rather not keep the
 *    password there:  history -c
 *  - DELETE THIS FILE once your admin user exists, if you want to be extra safe.
 *    It refuses to run over HTTP, but removing it leaves nothing to reason about.
 */

// Hard refusal when reached through a web request. This must be the first thing
// that happens, before any DB work.
if (PHP_SAPI !== 'cli') {
    http_response_code(403);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode([
        'error' => 'setup_admin.php can only be run from the command line (SSH).',
    ]);
    exit(1);
}

require_once __DIR__ . '/lib/db.php';
require_once __DIR__ . '/lib/uuid.php';

$argv = $_SERVER['argv'] ?? [];

if (count($argv) < 3) {
    fwrite(STDERR, "Usage: php api/setup_admin.php <username> <password>\n");
    exit(1);
}

$username = trim((string) $argv[1]);
$password = (string) $argv[2];

if ($username === '' || mb_strlen($username) > 191) {
    fwrite(STDERR, "Error: username must be 1-191 characters.\n");
    exit(1);
}
if (mb_strlen($password) < 8) {
    fwrite(STDERR, "Error: please choose a password of at least 8 characters.\n");
    exit(1);
}

try {
    $pdo  = get_db();
    $hash = password_hash($password, PASSWORD_DEFAULT);

    if ($hash === false) {
        fwrite(STDERR, "Error: could not hash the password.\n");
        exit(1);
    }

    $stmt = $pdo->prepare('SELECT id FROM admin_users WHERE username = :username LIMIT 1');
    $stmt->execute([':username' => $username]);
    $existing = $stmt->fetch();

    if ($existing) {
        $update = $pdo->prepare('UPDATE admin_users SET password_hash = :hash WHERE id = :id');
        $update->execute([':hash' => $hash, ':id' => $existing['id']]);
        fwrite(STDOUT, "Password updated for existing admin user '{$username}'.\n");
    } else {
        $insert = $pdo->prepare(
            'INSERT INTO admin_users (id, username, password_hash) VALUES (:id, :username, :hash)'
        );
        $insert->execute([
            ':id'       => uuid_v4(),
            ':username' => $username,
            ':hash'     => $hash,
        ]);
        fwrite(STDOUT, "Admin user '{$username}' created.\n");
    }

    fwrite(STDOUT, "You can now sign in at https://your-domain/admin/\n");
    exit(0);
} catch (Throwable $e) {
    fwrite(STDERR, 'Error: ' . $e->getMessage() . "\n");
    fwrite(STDERR, "Check that api/config.php has the right MySQL credentials and that api/schema.sql was imported.\n");
    exit(1);
}
