<?php
/**
 * Generic, spec-driven CRUD handler shared by the three content endpoints
 * (images.php, videos.php, projects.php).
 *
 * Security model
 * --------------
 *  - GET (list) is PUBLIC: the website needs to read content.
 *  - POST / PUT / PATCH / DELETE require an authenticated admin session.
 *  - Every user-supplied value is bound through a prepared statement. Table and
 *    column names come only from the hard-coded specs in this repo (never from
 *    request data), so they are safe to interpolate into the SQL text.
 */

require_once __DIR__ . '/db.php';
require_once __DIR__ . '/helpers.php';
require_once __DIR__ . '/uuid.php';

/** Build the list of DB columns to select for a resource (id first). */
function resource_db_columns(array $spec): array
{
    $cols = ['id'];
    foreach ($spec['columns'] as $col) {
        $cols[] = $col['db'];
    }
    return $cols;
}

/** Map a snake_case DB row to the camelCase JSON shape used by lib/types.ts. */
function resource_row_to_api(array $row, array $spec): array
{
    $out = ['id' => (string) $row['id']];
    foreach ($spec['columns'] as $col) {
        $value = $row[$col['db']] ?? null;
        $out[$col['api']] = $col['type'] === 'int' ? (int) $value : (string) ($value ?? '');
    }
    return $out;
}

/** Validate a single incoming field according to its column spec. */
function resource_validate_value($value, array $col)
{
    switch ($col['type']) {
        case 'int':
            return require_int($value, $col['api'], $col['min'] ?? 1, $col['max'] ?? 100000);

        case 'enum':
            $str = require_string($value, $col['api'], true, 32);
            if (!in_array($str, $col['values'], true)) {
                send_error(
                    "Field '{$col['api']}' must be one of: " . implode(', ', $col['values']),
                    422
                );
            }
            return $str;

        default:
            return require_string(
                $value,
                $col['api'],
                $col['required'] ?? false,
                $col['maxLen'] ?? 2000
            );
    }
}

/** Fetch every row for a resource in its configured order. */
function resource_list(PDO $pdo, array $spec): array
{
    $sql = 'SELECT ' . implode(', ', resource_db_columns($spec))
        . ' FROM ' . $spec['table']
        . ' ORDER BY ' . $spec['order'];

    $rows = $pdo->query($sql)->fetchAll();

    return array_map(static fn(array $row) => resource_row_to_api($row, $spec), $rows);
}

/** Fetch a single row by id, or null when it does not exist. */
function resource_find(PDO $pdo, array $spec, string $id): ?array
{
    $sql = 'SELECT ' . implode(', ', resource_db_columns($spec))
        . ' FROM ' . $spec['table'] . ' WHERE id = :id';

    $stmt = $pdo->prepare($sql);
    $stmt->execute([':id' => $id]);
    $row = $stmt->fetch();

    return $row ? resource_row_to_api($row, $spec) : null;
}

/** Insert a new row, generating its UUID in PHP. */
function resource_create(PDO $pdo, array $spec, array $body): array
{
    $id      = uuid_v4();
    $columns = ['id'];
    $holders = [':id'];
    $params  = [':id' => $id];

    foreach ($spec['columns'] as $col) {
        $value     = resource_validate_value($body[$col['api']] ?? null, $col);
        $columns[] = $col['db'];
        $holders[] = ':' . $col['db'];
        $params[':' . $col['db']] = $value;
    }

    $sql = 'INSERT INTO ' . $spec['table']
        . ' (' . implode(', ', $columns) . ') VALUES (' . implode(', ', $holders) . ')';

    $pdo->prepare($sql)->execute($params);

    $created = resource_find($pdo, $spec, $id);
    if ($created === null) {
        send_error('Failed to create record', 500);
    }

    return $created;
}

/** Apply a partial update to an existing row. */
function resource_update(PDO $pdo, array $spec, string $id, array $body): array
{
    if (resource_find($pdo, $spec, $id) === null) {
        send_error('Not found', 404);
    }

    $sets   = [];
    $params = [':id' => $id];

    foreach ($spec['columns'] as $col) {
        if (!array_key_exists($col['api'], $body)) {
            continue; // Partial update: only touch supplied fields.
        }
        $value  = resource_validate_value($body[$col['api']], $col);
        $sets[] = $col['db'] . ' = :' . $col['db'];
        $params[':' . $col['db']] = $value;
    }

    if (empty($sets)) {
        send_error('No updatable fields provided', 422);
    }

    $sql = 'UPDATE ' . $spec['table'] . ' SET ' . implode(', ', $sets) . ' WHERE id = :id';
    $pdo->prepare($sql)->execute($params);

    $updated = resource_find($pdo, $spec, $id);
    if ($updated === null) {
        send_error('Failed to update record', 500);
    }

    return $updated;
}

/**
 * Delete a row by id, and remove its uploaded image file if it owned one.
 * Without this the uploads/ folder would only ever grow, with no way to find
 * or reclaim files whose rows are gone.
 */
function resource_delete(PDO $pdo, array $spec, string $id): void
{
    // Capture the image path before the row disappears.
    $existing  = resource_find($pdo, $spec, $id);
    $imageKey  = $spec['image_field'] ?? null;
    $imagePath = ($existing && $imageKey) ? (string) ($existing[$imageKey] ?? '') : '';

    $stmt = $pdo->prepare('DELETE FROM ' . $spec['table'] . ' WHERE id = :id');
    $stmt->execute([':id' => $id]);

    if ($stmt->rowCount() === 0) {
        send_error('Not found', 404);
    }

    if ($imagePath !== '' && !resource_image_still_used($pdo, $imagePath)) {
        delete_uploaded_file($imagePath);
    }
}

/**
 * True when another row (in either table that stores images) still references
 * this file, so a shared image is never deleted out from under it.
 */
function resource_image_still_used(PDO $pdo, string $path): bool
{
    foreach ([['gallery_images', 'src'], ['projects', 'cover_src']] as [$table, $column]) {
        try {
            $stmt = $pdo->prepare(
                'SELECT COUNT(*) AS n FROM ' . $table . ' WHERE ' . $column . ' = :path'
            );
            $stmt->execute([':path' => $path]);
            if ((int) ($stmt->fetch()['n'] ?? 0) > 0) {
                return true;
            }
        } catch (PDOException $e) {
            // If we cannot check, err on the side of keeping the file.
            return true;
        }
    }
    return false;
}

/**
 * Delete a file that this app uploaded. Only paths inside the configured
 * uploads directory are ever touched: external URLs are left alone, and the
 * resolved real path must sit under the uploads root, so a crafted value like
 * "/uploads/../../config.php" cannot escape.
 */
function delete_uploaded_file(string $publicPath): void
{
    $config     = load_config();
    $uploadsUrl = rtrim((string) ($config['uploads_url'] ?? '/uploads'), '/');
    $uploadsDir = (string) ($config['uploads_dir'] ?? (__DIR__ . '/../../uploads'));

    // Only handle our own upload URLs, never external links.
    if ($uploadsUrl === '' || strpos($publicPath, $uploadsUrl . '/') !== 0) {
        return;
    }

    $name = basename(substr($publicPath, strlen($uploadsUrl) + 1));
    if ($name === '' || $name === '.' || $name === '..') {
        return;
    }

    $realDir = realpath($uploadsDir);
    if ($realDir === false) {
        return;
    }

    $target     = $realDir . DIRECTORY_SEPARATOR . $name;
    $realTarget = realpath($target);

    // Must exist, be a regular file, and live directly inside uploads/.
    if (
        $realTarget === false
        || !is_file($realTarget)
        || strpos($realTarget, $realDir . DIRECTORY_SEPARATOR) !== 0
    ) {
        return;
    }

    @unlink($realTarget);
}

/** Resolve the target record id from the query string or the JSON body. */
function resource_require_id(array $body): string
{
    $id = $_GET['id'] ?? ($body['id'] ?? null);
    if (!is_string($id) || trim($id) === '') {
        send_error("An 'id' is required", 422);
    }
    return trim($id);
}

/**
 * Entry point used by each endpoint file: dispatches the HTTP method against
 * the given resource spec and sends a JSON response.
 */
function resource_handle(array $spec): void
{
    handle_preflight();

    $method = request_method();

    try {
        $pdo = get_db();

        // Public read.
        if ($method === 'GET') {
            send_json(resource_list($pdo, $spec));
        }

        // Everything below mutates data and therefore requires an admin session.
        require_auth();

        switch ($method) {
            case 'POST':
                send_json(resource_create($pdo, $spec, read_json_body()), 201);
                // no break needed: send_json exits.

            case 'PUT':
            case 'PATCH':
                $body = read_json_body();
                send_json(resource_update($pdo, $spec, resource_require_id($body), $body));

            case 'DELETE':
                $body = read_json_body();
                resource_delete($pdo, $spec, resource_require_id($body));
                send_json(['ok' => true]);

            default:
                send_error('Method not allowed', 405);
        }
    } catch (PDOException $e) {
        // Never leak connection strings / credentials to the client.
        error_log('[magicframes-api] DB error: ' . $e->getMessage());
        send_error('Database error. Check api/config.php and that the schema was imported.', 500);
    } catch (RuntimeException $e) {
        // Configuration problems (e.g. missing config.php) — safe to surface,
        // since the message is written by us and contains no credentials.
        error_log('[magicframes-api] Config error: ' . $e->getMessage());
        send_error($e->getMessage(), 500);
    }
}
