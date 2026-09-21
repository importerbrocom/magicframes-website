<?php
/**
 * /api/images.php — image gallery CRUD.
 *
 *   GET    /api/images.php            -> public list (newest first)
 *   POST   /api/images.php            -> create   (admin session required)
 *   PUT    /api/images.php?id=<uuid>  -> update   (admin session required)
 *   DELETE /api/images.php?id=<uuid>  -> delete   (admin session required)
 *
 * JSON shape matches GalleryImage in lib/types.ts:
 *   { id, title, src, width, height, alt }
 *
 * `src` may be empty — the frontend then renders an annotated placeholder at
 * the given width/height.
 */

require_once __DIR__ . '/lib/crud.php';

resource_handle([
    'table'   => 'gallery_images',
    'order'   => 'created_at DESC, id DESC',
    'columns' => [
        ['db' => 'title',  'api' => 'title',  'type' => 'string', 'required' => false, 'maxLen' => 255],
        ['db' => 'src',    'api' => 'src',    'type' => 'string', 'required' => false, 'maxLen' => 2000],
        ['db' => 'width',  'api' => 'width',  'type' => 'int',    'min' => 1, 'max' => 100000],
        ['db' => 'height', 'api' => 'height', 'type' => 'int',    'min' => 1, 'max' => 100000],
        ['db' => 'alt',    'api' => 'alt',    'type' => 'string', 'required' => false, 'maxLen' => 500],
    ],
]);
