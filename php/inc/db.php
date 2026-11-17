<?php
/* ==========================================================
   PIXEL — database connection (PDO)
   db() always returns the same connection (created on first use).
   ========================================================== */
declare(strict_types=1);
defined('PIXEL') or exit;

function db(): PDO
{
    static $pdo = null;
    if ($pdo instanceof PDO) {
        return $pdo;
    }

    $dsn = sprintf(
        'mysql:host=%s;dbname=%s;charset=utf8mb4',
        config('db_host'),
        config('db_name')
    );

    $pdo = new PDO($dsn, config('db_user'), config('db_pass'), [
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,   // errors become exceptions
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES   => false,                    // real prepared statements
    ]);

    return $pdo;
}
