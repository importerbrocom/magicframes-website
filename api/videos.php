<?php
/**
 * /api/videos.php — video gallery CRUD.
 *
 *   GET    /api/videos.php            -> public list (newest first)
 *   POST   /api/videos.php            -> create   (admin session required)
 *   PUT    /api/videos.php?id=<uuid>  -> update   (admin session required)
 *   DELETE /api/videos.php?id=<uuid>  -> delete   (admin session required)
 *
 * JSON shape matches GalleryVideo in lib/types.ts:
 *   { id, title, provider, videoId, thumbnailWidth, thumbnailHeight }
 *
 * Videos are NOT uploaded — they stay hosted on YouTube / Vimeo and only the
 * video id is stored. For unlisted Vimeo links the privacy hash is preserved by
 * the frontend as "<id>:<hash>" (see lib/video.ts), which is why `videoId`
 * allows a wider character set than a bare numeric id.
 */

require_once __DIR__ . '/lib/crud.php';

resource_handle([
    'table'   => 'gallery_videos',
    'order'   => 'created_at DESC, id DESC',
    'columns' => [
        ['db' => 'title',    'api' => 'title',    'type' => 'string', 'required' => false, 'maxLen' => 255],
        ['db' => 'provider', 'api' => 'provider', 'type' => 'enum',   'values' => ['youtube', 'vimeo']],
        ['db' => 'video_id', 'api' => 'videoId',  'type' => 'string', 'required' => true,  'maxLen' => 255],
        ['db' => 'thumbnail_width',  'api' => 'thumbnailWidth',  'type' => 'int', 'min' => 1, 'max' => 100000],
        ['db' => 'thumbnail_height', 'api' => 'thumbnailHeight', 'type' => 'int', 'min' => 1, 'max' => 100000],
    ],
]);
