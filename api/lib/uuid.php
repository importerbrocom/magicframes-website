<?php
/**
 * RFC 4122 version-4 (random) UUID generator.
 *
 * Row IDs are generated in PHP (not by MySQL defaults) so the same code path
 * works identically on MySQL and on the sqlite driver used for local testing.
 */

function uuid_v4(): string
{
    $data = random_bytes(16);
    // Set version to 0100 (v4).
    $data[6] = chr((ord($data[6]) & 0x0f) | 0x40);
    // Set variant to 10xx.
    $data[8] = chr((ord($data[8]) & 0x3f) | 0x80);

    return vsprintf('%s%s-%s-%s-%s-%s%s%s', str_split(bin2hex($data), 4));
}
