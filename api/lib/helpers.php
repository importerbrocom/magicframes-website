<?php
/**
 * Shared HTTP / JSON helpers for the MagicFrames API.
 *
 * - JSON response helpers.
 * - Same-origin-friendly headers.
 * - Session bootstrap with secure cookie params.
 * - require_auth() gate for all mutating endpoints.
 * - Small input validation helpers.
 */

require_once __DIR__ . '/db.php';

/** Start the PHP session with hardened cookie params (idempotent). */
function start_secure_session(): void
{
    if (session_status() === PHP_SESSION_ACTIVE) {
        return;
    }

    $secure = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off')
        || (($_SERVER['SERVER_PORT'] ?? null) == 443);

    session_set_cookie_params([
        'lifetime' => 0,
        'path'     => '/',
        'httponly' => true,
        'samesite' => 'Lax',
        'secure'   => $secure,
    ]);
    session_name('mf_admin');
    session_start();
}

/** Emit optional CORS headers when allowed_origins is configured. */
function apply_cors_headers(): void
{
    $config = load_config();
    $allowed = $config['allowed_origins'] ?? [];
    if (empty($allowed)) {
        return; // Same-origin: no CORS needed.
    }
    $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
    if ($origin !== '' && in_array($origin, $allowed, true)) {
        header('Access-Control-Allow-Origin: ' . $origin);
        header('Access-Control-Allow-Credentials: true');
        header('Vary: Origin');
        header('Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS');
        header('Access-Control-Allow-Headers: Content-Type');
    }
}

/** Send a JSON response with the given HTTP status and exit. */
function send_json($data, int $status = 200): void
{
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    header('X-Content-Type-Options: nosniff');
    apply_cors_headers();
    echo json_encode($data, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    exit;
}

/** Convenience error response. */
function send_error(string $message, int $status = 400): void
{
    send_json(['error' => $message], $status);
}

/** Handle a CORS preflight OPTIONS request early, if any. */
function handle_preflight(): void
{
    if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'OPTIONS') {
        http_response_code(204);
        apply_cors_headers();
        exit;
    }
}

/** Read and decode a JSON request body into an array (empty array if none). */
function read_json_body(): array
{
    $raw = file_get_contents('php://input');
    if ($raw === false || $raw === '') {
        return [];
    }
    $decoded = json_decode($raw, true);
    if (!is_array($decoded)) {
        send_error('Invalid JSON body', 400);
    }
    return $decoded;
}

/**
 * Require an authenticated admin session. Sends 401 JSON and exits when the
 * caller is not logged in. Every mutating endpoint must call this first.
 */
function require_auth(): void
{
    start_secure_session();
    if (empty($_SESSION['admin_user_id'])) {
        send_json(['error' => 'Unauthorized'], 401);
    }
}

/** Coerce/validate a value to a non-negative integer within an optional max. */
function require_int($value, string $field, int $min = 0, int $max = PHP_INT_MAX): int
{
    if (is_bool($value) || !is_numeric($value)) {
        send_error("Field '$field' must be an integer", 422);
    }
    $int = (int) $value;
    if ($int < $min || $int > $max) {
        send_error("Field '$field' is out of range", 422);
    }
    return $int;
}

/** Validate/normalize a string field with a max length. */
function require_string($value, string $field, bool $required = true, int $maxLen = 2000): string
{
    if ($value === null) {
        $value = '';
    }
    if (!is_string($value)) {
        send_error("Field '$field' must be a string", 422);
    }
    $value = trim($value);
    if ($required && $value === '') {
        send_error("Field '$field' is required", 422);
    }
    if (mb_strlen($value) > $maxLen) {
        send_error("Field '$field' is too long", 422);
    }
    return $value;
}

/** Read the request method, honoring an optional _method override for forms. */
function request_method(): string
{
    return strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');
}
