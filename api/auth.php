<?php
/**
 * /api/auth.php — real server-side admin authentication.
 *
 *   POST /api/auth.php?action=login   { "username": "...", "password": "..." }
 *        -> 200 { ok: true, user: { username } }  + session cookie
 *        -> 401 { error: "Invalid username or password" }
 *
 *   POST /api/auth.php?action=logout  -> 200 { ok: true }   (destroys session)
 *
 *   GET  /api/auth.php?action=me      -> 200 { authenticated: bool, username }
 *
 * Passwords are verified against the bcrypt hash stored in admin_users
 * (created with password_hash()). The password itself is never stored, never
 * logged, and never sent to the browser. The session id is the only credential
 * the client holds, in an HttpOnly cookie.
 */

require_once __DIR__ . '/lib/db.php';
require_once __DIR__ . '/lib/helpers.php';
require_once __DIR__ . '/lib/throttle.php';

handle_preflight();
start_secure_session();

$method = request_method();
$action = is_string($_GET['action'] ?? null) ? $_GET['action'] : '';

// ---------------------------------------------------------------------------
// GET ?action=me — lets the admin UI re-hydrate its auth state on page load.
// ---------------------------------------------------------------------------
if ($method === 'GET') {
    if ($action !== '' && $action !== 'me') {
        send_error('Unsupported action', 400);
    }
    send_json([
        'authenticated' => !empty($_SESSION['admin_user_id']),
        'username'      => $_SESSION['admin_username'] ?? null,
    ]);
}

if ($method !== 'POST') {
    send_error('Method not allowed', 405);
}

$body = read_json_body();
if ($action === '') {
    $action = is_string($body['action'] ?? null) ? $body['action'] : '';
}

// ---------------------------------------------------------------------------
// Logout
// ---------------------------------------------------------------------------
if ($action === 'logout') {
    $_SESSION = [];
    if (ini_get('session.use_cookies')) {
        $params = session_get_cookie_params();
        setcookie(session_name(), '', [
            'expires'  => time() - 42000,
            'path'     => $params['path'] ?? '/',
            'httponly' => true,
            'samesite' => $params['samesite'] ?? 'Lax',
            'secure'   => $params['secure'] ?? false,
        ]);
    }
    session_destroy();
    send_json(['ok' => true]);
}

// ---------------------------------------------------------------------------
// Login
// ---------------------------------------------------------------------------
if ($action === 'login') {
    $username = require_string($body['username'] ?? '', 'username', true, 191);
    $password = $body['password'] ?? '';

    // Deliberately generic failure message: never reveal whether it was the
    // username or the password that was wrong.
    $invalid = static function (): void {
        usleep(300000); // Small constant delay to slow down brute forcing.
        send_json(['error' => 'Invalid username or password'], 401);
    };

    if (!is_string($password) || $password === '') {
        $invalid();
    }

    try {
        $pdo = get_db();
        throttle_check($pdo, $username);

        $stmt = $pdo->prepare(
            'SELECT id, username, password_hash FROM admin_users WHERE username = :username LIMIT 1'
        );
        $stmt->execute([':username' => $username]);
        $row = $stmt->fetch();
    } catch (PDOException $e) {
        error_log('[magicframes-api] auth DB error: ' . $e->getMessage());
        send_error('Database error. Check api/config.php and that the schema was imported.', 500);
        return;
    } catch (RuntimeException $e) {
        error_log('[magicframes-api] auth config error: ' . $e->getMessage());
        send_error($e->getMessage(), 500);
        return;
    }

    // Always run a bcrypt verification, even when the username does not exist,
    // so the response time does not reveal which usernames are real.
    $hash = $row
        ? (string) $row['password_hash']
        : '$2y$10$usesomesillystringfoeswpNpNSfDkYQNfqxLW6lrPeKVOvZ8jpSe';

    if (!password_verify($password, $hash) || !$row) {
        throttle_record_failure($pdo, $username);
        $invalid();
    }

    throttle_clear($pdo, $username);

    // Prevent session fixation, then record the authenticated identity.
    session_regenerate_id(true);
    $_SESSION['admin_user_id']  = (string) $row['id'];
    $_SESSION['admin_username'] = (string) $row['username'];

    send_json(['ok' => true, 'user' => ['username' => (string) $row['username']]]);
}

send_error('Unsupported action', 400);
