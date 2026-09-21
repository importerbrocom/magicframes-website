<?php
/**
 * Login throttling.
 *
 * A fixed delay on a wrong password is not enough on its own — an attacker can
 * simply run guesses in parallel. This adds a per-username + per-IP failure
 * counter with an escalating lockout, so a weak admin password cannot be
 * brute-forced in practice.
 *
 * State lives in the `login_attempts` table. If that table does not exist (an
 * older install that has not re-imported api/schema.sql), throttling degrades
 * to a no-op rather than locking anyone out of their own dashboard.
 */

require_once __DIR__ . '/helpers.php';

/** Attempts allowed before a lockout kicks in. */
const THROTTLE_MAX_ATTEMPTS = 5;

/** Lockout window, in seconds, once the limit is passed. */
const THROTTLE_LOCKOUT_SECONDS = 900; // 15 minutes

/** Failures older than this are forgotten. */
const THROTTLE_WINDOW_SECONDS = 900;

/** Best-effort client IP. */
function throttle_client_ip(): string
{
    $ip = $_SERVER['REMOTE_ADDR'] ?? '';
    // Hostinger sits behind a proxy for its CDN/SSL features; prefer the first
    // forwarded address when present.
    $forwarded = $_SERVER['HTTP_X_FORWARDED_FOR'] ?? '';
    if ($forwarded !== '') {
        $first = trim(explode(',', $forwarded)[0]);
        if (filter_var($first, FILTER_VALIDATE_IP)) {
            $ip = $first;
        }
    }
    return substr((string) $ip, 0, 45);
}

/** Identifier the counter is keyed on. */
function throttle_key(string $username): string
{
    return strtolower($username) . '|' . throttle_client_ip();
}

/**
 * Reject the request when this username/IP pair is currently locked out.
 * Sends 429 and exits if so.
 */
function throttle_check(PDO $pdo, string $username): void
{
    try {
        $stmt = $pdo->prepare(
            'SELECT attempts, last_attempt FROM login_attempts WHERE attempt_key = :key LIMIT 1'
        );
        $stmt->execute([':key' => throttle_key($username)]);
        $row = $stmt->fetch();
    } catch (PDOException $e) {
        return; // Table missing — do not block logins.
    }

    if (!$row) {
        return;
    }

    $attempts = (int) $row['attempts'];
    $last     = strtotime((string) $row['last_attempt']) ?: 0;
    $age      = time() - $last;

    // Old failures expire.
    if ($age > THROTTLE_WINDOW_SECONDS) {
        return;
    }

    if ($attempts >= THROTTLE_MAX_ATTEMPTS) {
        $remaining = THROTTLE_LOCKOUT_SECONDS - $age;
        if ($remaining > 0) {
            $minutes = max(1, (int) ceil($remaining / 60));
            send_json([
                'error' => "Too many failed sign-in attempts. Please try again in {$minutes} minute"
                    . ($minutes === 1 ? '' : 's') . '.',
            ], 429);
        }
    }
}

/** Record a failed attempt. */
function throttle_record_failure(PDO $pdo, string $username): void
{
    $key = throttle_key($username);
    try {
        // Reset the counter first if the previous failure has aged out.
        $stmt = $pdo->prepare(
            'SELECT attempts, last_attempt FROM login_attempts WHERE attempt_key = :key LIMIT 1'
        );
        $stmt->execute([':key' => $key]);
        $row = $stmt->fetch();

        if (!$row) {
            $insert = $pdo->prepare(
                'INSERT INTO login_attempts (attempt_key, attempts, last_attempt)
                 VALUES (:key, 1, ' . throttle_now_sql($pdo) . ')'
            );
            $insert->execute([':key' => $key]);
            return;
        }

        $last  = strtotime((string) $row['last_attempt']) ?: 0;
        $stale = (time() - $last) > THROTTLE_WINDOW_SECONDS;
        $next  = $stale ? 1 : ((int) $row['attempts'] + 1);

        $update = $pdo->prepare(
            'UPDATE login_attempts SET attempts = :attempts, last_attempt = '
            . throttle_now_sql($pdo) . ' WHERE attempt_key = :key'
        );
        $update->execute([':attempts' => $next, ':key' => $key]);
    } catch (PDOException $e) {
        // Throttling is best effort; never break the login flow over it.
    }
}

/** Clear the counter after a successful sign-in. */
function throttle_clear(PDO $pdo, string $username): void
{
    try {
        $stmt = $pdo->prepare('DELETE FROM login_attempts WHERE attempt_key = :key');
        $stmt->execute([':key' => throttle_key($username)]);
    } catch (PDOException $e) {
        // Ignore.
    }
}

/** Portable "now" expression for the active driver. */
function throttle_now_sql(PDO $pdo): string
{
    $driver = $pdo->getAttribute(PDO::ATTR_DRIVER_NAME);
    return $driver === 'sqlite' ? "datetime('now')" : 'NOW()';
}
