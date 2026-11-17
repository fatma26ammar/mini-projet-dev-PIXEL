<?php
/* ==========================================================
   PIXEL — configuration
   These are the XAMPP / WAMP defaults. To use other values
   WITHOUT editing this file (and without pushing passwords to
   GitHub), create php/inc/config.local.php that returns an
   array with only the keys you want to change:

       <?php return ['db_pass' => 'my-secret', 'debug' => false];
   ========================================================== */
declare(strict_types=1);
defined('PIXEL') or exit; // this file is only meant to be included

$config = [
    // --- Database ---
    'db_host'    => 'localhost',
    'db_name'    => 'pixel',
    'db_user'    => 'root',
    'db_pass'    => '',            // XAMPP's root user has no password by default

    // --- Email ---
    // 'log'  : write the email to php/storage/mail.log (works everywhere, ideal for the demo)
    // 'mail' : use PHP's mail() (needs a configured mail server / sendmail)
    'mail_mode'  => 'log',
    'mail_to'    => 'contact@pixel.example',
    'mail_from'  => 'no-reply@pixel.example',

    // --- Anti-spam ---
    'min_fill_seconds'  => 3,      // a human needs at least 3 s to fill the form
    'rate_limit_max'    => 5,      // max messages per visitor...
    'rate_limit_window' => 600,    // ...in this many seconds (10 minutes)
    'ip_salt'           => 'change-this-random-text', // makes the stored IP hash unguessable

    // --- Admin page (php/admin.php) ---
    'admin_user' => 'admin',
    'admin_pass' => 'pixel-admin', // change it!

    // --- Misc ---
    'timezone'   => 'Africa/Tunis',
    'debug'      => true,          // true = JSON errors include technical details. Set false when deployed.
];

$local = __DIR__ . '/config.local.php';
if (is_file($local)) {
    $config = array_replace($config, (array) require $local);
}

return $config;
