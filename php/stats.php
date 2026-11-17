<?php
/* ==========================================================
   GET php/stats.php
   Reads the database and returns the live numbers as JSON:
   messages received, total clicks, and clicks per button.
   script.js uses it to fill the line at the bottom of the page.
   ========================================================== */
declare(strict_types=1);
define('PIXEL', true);
require __DIR__ . '/inc/helpers.php';
require __DIR__ . '/inc/db.php';

require_method('GET');

$messages = (int) db()->query('SELECT COUNT(*) FROM messages')->fetchColumn();
$buttons  = db()->query('SELECT button_id AS id, label, total FROM click_counters ORDER BY total DESC, label')->fetchAll();

foreach ($buttons as &$button) {
    $button['total'] = (int) $button['total'];
}
unset($button);

json_out([
    'ok'       => true,
    'messages' => $messages,
    'clicks'   => array_sum(array_column($buttons, 'total')),
    'buttons'  => $buttons,
]);
