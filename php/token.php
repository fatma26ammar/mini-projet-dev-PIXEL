<?php
/* ==========================================================
   GET php/token.php
   Gives the page a one-time security token (CSRF) and starts
   the "time trap" clock. script.js calls it when the page loads.
   ========================================================== */
declare(strict_types=1);
define('PIXEL', true);
require __DIR__ . '/inc/helpers.php';

require_method('GET');

json_out(['ok' => true, 'token' => csrf_token()]);
