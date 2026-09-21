<?php
/**
 * /api/upload.php — authenticated image upload.
 *
 *   POST /api/upload.php   (multipart/form-data, field name: "file")
 *        -> 200 { ok: true, url: "/uploads/<random>.jpg", width, height }
 *        -> 401 when there is no admin session
 *        -> 422 when the file is missing / too large / not a real image
 *
 * The returned `url` is what you store in an image's `src` or a project's
 * `coverSrc`.
 *
 * Hardening
 * ---------
 *  - Requires an authenticated admin session (require_auth) BEFORE anything else.
 *  - The client-supplied filename is never used. A random UUID name is generated.
 *  - The extension must be one of jpg/jpeg/png/webp/gif, AND the real MIME type
 *    (sniffed with finfo) must be the matching image type. Anything else — .php,
 *    .phtml, .svg, .html, double extensions, spoofed content — is rejected.
 *  - Files land in uploads/ which sits OUTSIDE api/ and ships with an .htaccess
 *    that disables script execution, so an uploaded file can never be run.
 */

require_once __DIR__ . '/lib/db.php';
require_once __DIR__ . '/lib/helpers.php';
require_once __DIR__ . '/lib/uuid.php';

handle_preflight();

// Auth first: an unauthenticated caller must never be able to write files.
require_auth();

if (request_method() !== 'POST') {
    send_error('Method not allowed', 405);
}

$config   = load_config();
$maxBytes = (int) ($config['max_upload_bytes'] ?? 8 * 1024 * 1024);

$file = $_FILES['file'] ?? null;
if (!is_array($file) || !isset($file['tmp_name'])) {
    send_error("No file uploaded. Send a multipart form with a 'file' field.", 422);
}

// --- PHP-level upload errors -------------------------------------------------
$phpError = (int) ($file['error'] ?? UPLOAD_ERR_NO_FILE);
if ($phpError !== UPLOAD_ERR_OK) {
    $messages = [
        UPLOAD_ERR_INI_SIZE   => 'The file is larger than the server allows (upload_max_filesize).',
        UPLOAD_ERR_FORM_SIZE  => 'The file is larger than the form allows.',
        UPLOAD_ERR_PARTIAL    => 'The upload was interrupted. Please try again.',
        UPLOAD_ERR_NO_FILE    => 'No file was uploaded.',
        UPLOAD_ERR_NO_TMP_DIR => 'Server is missing a temporary folder.',
        UPLOAD_ERR_CANT_WRITE => 'Server could not write the file to disk.',
        UPLOAD_ERR_EXTENSION  => 'A PHP extension blocked the upload.',
    ];
    send_error($messages[$phpError] ?? 'Upload failed.', 422);
}

$tmpPath = (string) $file['tmp_name'];
if (!is_uploaded_file($tmpPath)) {
    // Guards against a crafted request pointing at an arbitrary local path.
    send_error('Invalid upload.', 422);
}

// --- Size --------------------------------------------------------------------
$size = (int) ($file['size'] ?? 0);
if ($size <= 0) {
    send_error('The uploaded file is empty.', 422);
}
if ($size > $maxBytes) {
    send_error('The image is too large. Maximum size is ' . round($maxBytes / 1048576, 1) . ' MB.', 422);
}

// --- Extension allow-list (from the original name, only to pick a suffix) ----
$allowed = [
    'jpg'  => ['image/jpeg'],
    'jpeg' => ['image/jpeg'],
    'png'  => ['image/png'],
    'webp' => ['image/webp'],
    'gif'  => ['image/gif'],
];

$originalName = (string) ($file['name'] ?? '');
$extension    = strtolower(pathinfo($originalName, PATHINFO_EXTENSION));

if (!isset($allowed[$extension])) {
    send_error('Unsupported file type. Please upload a JPG, PNG, WebP, or GIF image.', 422);
}

// --- Real content type must match the extension ------------------------------
if (!function_exists('finfo_open')) {
    send_error('Server cannot verify file types (missing fileinfo extension).', 500);
}
$finfo = finfo_open(FILEINFO_MIME_TYPE);
$mime  = $finfo ? (string) finfo_file($finfo, $tmpPath) : '';
if ($finfo) {
    finfo_close($finfo);
}

if (!in_array($mime, $allowed[$extension], true)) {
    send_error('That file is not a valid ' . strtoupper($extension) . ' image.', 422);
}

// Belt and braces: it must decode as a real raster image.
$dimensions = @getimagesize($tmpPath);
if ($dimensions === false) {
    send_error('That file is not a readable image.', 422);
}
[$width, $height] = $dimensions;

// --- Destination -------------------------------------------------------------
$uploadsDir = (string) ($config['uploads_dir'] ?? (__DIR__ . '/../uploads'));
$uploadsUrl = rtrim((string) ($config['uploads_url'] ?? '/uploads'), '/');

if (!is_dir($uploadsDir) && !@mkdir($uploadsDir, 0755, true) && !is_dir($uploadsDir)) {
    send_error('Could not create the uploads folder. Check folder permissions.', 500);
}
if (!is_writable($uploadsDir)) {
    send_error('The uploads folder is not writable. Set its permissions to 755.', 500);
}

// Never reuse the client filename — generate our own.
$safeName    = uuid_v4() . '.' . $extension;
$destination = rtrim($uploadsDir, '/') . '/' . $safeName;

if (!move_uploaded_file($tmpPath, $destination)) {
    send_error('Could not save the uploaded file.', 500);
}
@chmod($destination, 0644);

// Strip camera metadata (EXIF) by re-encoding the image. Wedding photos
// routinely carry GPS coordinates and device details, and these files are
// served publicly — so this is a privacy measure, not just hygiene. It also
// neutralises any data smuggled in metadata. Set 'strip_metadata' => false in
// config.php to keep the original bytes.
if (($config['strip_metadata'] ?? true) && function_exists('imagecreatefromstring')) {
    strip_image_metadata($destination, $extension, (int) ($config['jpeg_quality'] ?? 92));
}

// Make sure the uploads folder can never execute scripts, even if something
// unexpected ends up in there.
ensure_uploads_guard($uploadsDir);

send_json([
    'ok'     => true,
    'url'    => $uploadsUrl . '/' . $safeName,
    'width'  => (int) $width,
    'height' => (int) $height,
]);

/**
 * Re-encode an image in place so no metadata survives. Animated GIFs are left
 * alone, because GD would flatten them to a single frame.
 */
function strip_image_metadata(string $path, string $extension, int $jpegQuality): void
{
    if ($extension === 'gif') {
        return; // Avoid destroying animation.
    }

    $raw = @file_get_contents($path);
    if ($raw === false) {
        return;
    }

    $image = @imagecreatefromstring($raw);
    if ($image === false) {
        return; // Leave the validated original in place.
    }

    // Preserve transparency for the formats that support it.
    if ($extension === 'png' || $extension === 'webp') {
        imagealphablending($image, false);
        imagesavealpha($image, true);
    }

    $temp = $path . '.tmp';
    $ok   = false;
    switch ($extension) {
        case 'jpg':
        case 'jpeg':
            $ok = imagejpeg($image, $temp, $jpegQuality);
            break;
        case 'png':
            $ok = imagepng($image, $temp);
            break;
        case 'webp':
            $ok = function_exists('imagewebp') ? imagewebp($image, $temp, $jpegQuality) : false;
            break;
    }
    imagedestroy($image);

    if ($ok && is_file($temp) && filesize($temp) > 0) {
        @rename($temp, $path);
        @chmod($path, 0644);
    } else {
        @unlink($temp);
    }
}

/** Write the no-execute guard into the uploads folder if it is missing. */
function ensure_uploads_guard(string $uploadsDir): void
{
    $guard = rtrim($uploadsDir, '/') . '/.htaccess';
    if (is_file($guard)) {
        return;
    }

    // NOTE: php_flag is mod_php-only and returns 500 under PHP-FPM if used
    // unguarded, so it is wrapped. RemoveHandler/AddType are core Apache and
    // do the real work.
    @file_put_contents(
        $guard,
        "# Serve uploads as static files only — never execute them.\n"
        . "<IfModule mod_php.c>\n    php_flag engine off\n</IfModule>\n"
        . "<IfModule mod_php7.c>\n    php_flag engine off\n</IfModule>\n"
        . "<IfModule mod_php5.c>\n    php_flag engine off\n</IfModule>\n"
        . "RemoveHandler .php .phtml .phar .php3 .php4 .php5 .php7 .php8 .cgi .pl .py\n"
        . "AddType text/plain .php .phtml .phar .php3 .php4 .php5 .php7 .php8\n"
        . "Options -Indexes -ExecCGI\n"
        . "<IfModule mod_headers.c>\n"
        . "    Header set X-Content-Type-Options \"nosniff\"\n"
        . "</IfModule>\n"
    );
}
