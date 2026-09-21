<?php
/**
 * /api/projects.php — "Latest Projects" CRUD.
 *
 *   GET    /api/projects.php            -> public list (latest first)
 *   POST   /api/projects.php            -> create   (admin session required)
 *   PUT    /api/projects.php?id=<uuid>  -> update   (admin session required)
 *   DELETE /api/projects.php?id=<uuid>  -> delete   (admin session required)
 *
 * JSON shape matches Project in lib/types.ts:
 *   { id, title, description, coverSrc, coverWidth, coverHeight, date }
 *
 * `date` is a free-form string (e.g. "2024-11-12" or "June 2024"), so the SQL
 * ordering below is a best effort and the frontend additionally sorts
 * defensively before rendering.
 */

require_once __DIR__ . '/lib/crud.php';

resource_handle([
    'table'       => 'projects',
    'order'       => 'date DESC, created_at DESC',
    // Deleting a row also deletes the uploaded cover file this field points at.
    'image_field' => 'coverSrc',
    'columns'     => [
        ['db' => 'title',        'api' => 'title',       'type' => 'string', 'required' => false, 'maxLen' => 255],
        ['db' => 'description',  'api' => 'description', 'type' => 'string', 'required' => false, 'maxLen' => 5000],
        ['db' => 'cover_src',    'api' => 'coverSrc',    'type' => 'string', 'required' => false, 'maxLen' => 2000],
        ['db' => 'cover_width',  'api' => 'coverWidth',  'type' => 'int',    'min' => 1, 'max' => 100000],
        ['db' => 'cover_height', 'api' => 'coverHeight', 'type' => 'int',    'min' => 1, 'max' => 100000],
        ['db' => 'date',         'api' => 'date',        'type' => 'string', 'required' => false, 'maxLen' => 64],
    ],
]);
