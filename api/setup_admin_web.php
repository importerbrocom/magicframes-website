<?php
/**
 * One-time, browser-based admin setup — for accounts WITHOUT SSH access.
 *
 * Usage:
 *   1. Upload this file to  mabsite/api/setup_admin_web.php
 *   2. Visit                https://yourdomain.com/api/setup_admin_web.php
 *   3. Choose a username + password
 *   4. The file deletes itself on success (delete it manually if that fails)
 *
 * Safety design
 * -------------
 *  - It REFUSES to do anything once an admin user exists, so it cannot be used
 *    by a stranger to add themselves later if it is left on the server.
 *  - The password is hashed with password_hash() on your own server; it is never
 *    sent to any third party and never stored in plain text.
 *  - It deletes itself after a successful setup.
 *  - A session-bound token guards the form against cross-site submission.
 *
 * Forgot your password later? In phpMyAdmin run:
 *     DELETE FROM admin_users;
 * then re-upload this file and run it again.
 *
 * NOTE: api/.htaccess denies direct access to `setup_admin.php` (the CLI
 * script). This file has a deliberately different name so it stays reachable.
 */

require_once __DIR__ . '/lib/db.php';
require_once __DIR__ . '/lib/uuid.php';

// ---------------------------------------------------------------------------
// Page helpers (plain HTML — this page must work before anything else does)
// ---------------------------------------------------------------------------

function page(string $title, string $bodyHtml, int $status = 200): void
{
    http_response_code($status);
    header('Content-Type: text/html; charset=utf-8');
    header('X-Robots-Tag: noindex, nofollow');
    header('Cache-Control: no-store');
    echo '<!doctype html><html lang="en"><head><meta charset="utf-8">'
        . '<meta name="viewport" content="width=device-width,initial-scale=1">'
        . '<meta name="robots" content="noindex,nofollow">'
        . '<title>' . htmlspecialchars($title, ENT_QUOTES) . ' — MagicFrames</title>'
        . '<style>'
        . ':root{color-scheme:light}'
        . '*{box-sizing:border-box}'
        . 'body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;'
        . 'padding:24px;font-family:ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif;'
        . 'background:linear-gradient(135deg,#fdf2f4,#fbe8ec 45%,#f7ecd9);color:#2b2522}'
        . '.card{width:100%;max-width:460px;background:rgba(255,255,255,.92);border-radius:24px;'
        . 'padding:32px;box-shadow:0 18px 50px rgba(43,37,34,.12);border:1px solid #f6dfe5}'
        . 'h1{font-size:26px;margin:.2em 0 .1em;font-weight:600}'
        . '.eyebrow{font-size:11px;letter-spacing:.35em;text-transform:uppercase;color:#c8a24a;margin:0}'
        . 'p{font-size:14px;line-height:1.6;color:#6b615c}'
        . 'label{display:block;font-size:11px;letter-spacing:.14em;text-transform:uppercase;'
        . 'color:#6b615c;margin-top:18px}'
        . 'input{width:100%;margin-top:7px;padding:12px 14px;font-size:15px;border-radius:10px;'
        . 'border:1px solid #f0cfd8;background:#fdf6f8;color:#2b2522}'
        . 'input:focus{outline:none;border-color:#c8a24a}'
        . 'button{width:100%;margin-top:24px;padding:13px;border:0;border-radius:999px;'
        . 'background:#2b2522;color:#fdf2f4;font-size:12px;letter-spacing:.16em;'
        . 'text-transform:uppercase;cursor:pointer}'
        . 'button:hover{background:#c8a24a}'
        . '.msg{margin-top:18px;padding:12px 14px;border-radius:10px;font-size:14px;line-height:1.5}'
        . '.err{background:#fdeaee;color:#a3324c;border:1px solid #f4c4cf}'
        . '.ok{background:#eaf6ee;color:#276845;border:1px solid #bfe3cd}'
        . '.warn{background:#fdf4e3;color:#8a6414;border:1px solid #f0dcb0}'
        . 'code{background:#f5eef0;padding:2px 6px;border-radius:5px;font-size:13px}'
        . 'a{color:#c8a24a}'
        . '.hint{font-size:12.5px;color:#8a807b;margin-top:8px}'
        . '</style></head><body><div class="card">'
        . '<p class="eyebrow">MagicFrames</p>'
        . $bodyHtml
        . '</div></body></html>';
    exit;
}

function fail(string $title, string $message, int $status = 400): void
{
    page($title, '<h1>' . htmlspecialchars($title, ENT_QUOTES) . '</h1>'
        . '<div class="msg err">' . $message . '</div>', $status);
}

// ---------------------------------------------------------------------------
// Preconditions
// ---------------------------------------------------------------------------

// Warn (but do not block) when not on HTTPS — a password is about to be typed.
$forwarded = strtolower(trim((string) ($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '')));
$isHttps = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off')
    || (($_SERVER['SERVER_PORT'] ?? null) == 443)
    || $forwarded === 'https';

try {
    $pdo = get_db();
} catch (Throwable $e) {
    fail(
        'Database not connected',
        'The site cannot reach your database yet. Open <code>api/config.php</code> and check the '
        . 'database name, username and password, then reload this page.'
        . '<br><br>Details: ' . htmlspecialchars($e->getMessage(), ENT_QUOTES),
        500
    );
}

// The admin_users table must exist, i.e. schema.sql must have been imported.
try {
    $count = (int) $pdo->query('SELECT COUNT(*) AS n FROM admin_users')->fetch()['n'];
} catch (PDOException $e) {
    fail(
        'Tables not created yet',
        'Your database is reachable, but the tables are missing. In phpMyAdmin, select your '
        . 'database, open the <strong>Import</strong> tab, choose <code>api/schema.sql</code> '
        . 'and run it. Then reload this page.',
        500
    );
}

// Once an admin exists this page must do nothing at all.
if ($count > 0) {
    page('Already set up',
        '<h1>Already set up</h1>'
        . '<div class="msg warn">An admin user already exists, so this page is disabled.</div>'
        . '<p><strong>Please delete this file now:</strong> <code>api/setup_admin_web.php</code></p>'
        . '<p class="hint">Forgot your password? In phpMyAdmin run '
        . '<code>DELETE FROM admin_users;</code> then re-upload this file and run it again.</p>'
        . '<p><a href="/admin/">Go to the dashboard →</a></p>',
        403
    );
}

// ---------------------------------------------------------------------------
// Form token (guards against a cross-site POST)
// ---------------------------------------------------------------------------

if (session_status() !== PHP_SESSION_ACTIVE) {
    session_set_cookie_params([
        'lifetime' => 0, 'path' => '/', 'httponly' => true,
        'samesite' => 'Lax', 'secure' => $isHttps,
    ]);
    session_name('mf_setup');
    session_start();
}

if (empty($_SESSION['setup_token'])) {
    $_SESSION['setup_token'] = bin2hex(random_bytes(16));
}
$token = (string) $_SESSION['setup_token'];

$httpsWarning = $isHttps ? '' :
    '<div class="msg warn">You are not on a secure (HTTPS) connection. Turn on SSL in '
    . 'hPanel first, or your password will be sent unencrypted.</div>';

// ---------------------------------------------------------------------------
// Handle submission
// ---------------------------------------------------------------------------

$error = '';

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'POST') {
    $submittedToken = (string) ($_POST['token'] ?? '');

    if (!hash_equals($token, $submittedToken)) {
        $error = 'Your session expired. Please try again.';
    } else {
        $username = trim((string) ($_POST['username'] ?? ''));
        $password = (string) ($_POST['password'] ?? '');
        $confirm  = (string) ($_POST['confirm'] ?? '');

        if ($username === '' || mb_strlen($username) > 191) {
            $error = 'Please enter a username (up to 191 characters).';
        } elseif (mb_strlen($password) < 8) {
            $error = 'Please choose a password of at least 8 characters.';
        } elseif ($password !== $confirm) {
            $error = 'The two passwords do not match.';
        } else {
            $hash = password_hash($password, PASSWORD_DEFAULT);
            if ($hash === false) {
                $error = 'Could not secure the password. Please try again.';
            } else {
                try {
                    $stmt = $pdo->prepare(
                        'INSERT INTO admin_users (id, username, password_hash)
                         VALUES (:id, :username, :hash)'
                    );
                    $stmt->execute([
                        ':id'       => uuid_v4(),
                        ':username' => $username,
                        ':hash'     => $hash,
                    ]);

                    // Invalidate the token and try to remove this file.
                    unset($_SESSION['setup_token']);
                    $deleted = @unlink(__FILE__);

                    $cleanup = $deleted
                        ? '<div class="msg ok">This setup page has deleted itself. Nothing else to do.</div>'
                        : '<div class="msg warn"><strong>One last step:</strong> delete '
                          . '<code>api/setup_admin_web.php</code> from your server using File Manager.</div>';

                    page('Admin created',
                        '<h1>Admin user created</h1>'
                        . '<div class="msg ok">You can now sign in as <strong>'
                        . htmlspecialchars($username, ENT_QUOTES) . '</strong>.</div>'
                        . $cleanup
                        . '<p><a href="/admin/">Go to your dashboard →</a></p>'
                    );
                } catch (PDOException $e) {
                    error_log('[magicframes-setup] ' . $e->getMessage());
                    $error = 'Could not save the admin user. Please try again.';
                }
            }
        }
    }
}

// ---------------------------------------------------------------------------
// Render the form
// ---------------------------------------------------------------------------

$errorHtml = $error !== ''
    ? '<div class="msg err">' . htmlspecialchars($error, ENT_QUOTES) . '</div>'
    : '';

page('Create your admin login',
    '<h1>Create your admin login</h1>'
    . '<p>This one-time page creates the account you will use to manage your galleries '
    . 'and projects. Your password is encrypted on your own server.</p>'
    . $httpsWarning
    . $errorHtml
    . '<form method="post" autocomplete="off">'
    . '<input type="hidden" name="token" value="' . htmlspecialchars($token, ENT_QUOTES) . '">'
    . '<label for="u">Username</label>'
    . '<input id="u" name="username" type="text" required maxlength="191" placeholder="admin"'
    . ' value="' . htmlspecialchars((string) ($_POST['username'] ?? ''), ENT_QUOTES) . '">'
    . '<label for="p">Password</label>'
    . '<input id="p" name="password" type="password" required minlength="8" placeholder="At least 8 characters">'
    . '<label for="c">Confirm password</label>'
    . '<input id="c" name="confirm" type="password" required minlength="8" placeholder="Type it again">'
    . '<button type="submit">Create admin user</button>'
    . '</form>'
    . '<p class="hint">After this succeeds, the page removes itself so nobody else can use it.</p>'
);
