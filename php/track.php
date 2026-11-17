<?php
/* ==========================================================
   POST php/track.php   (body: button=<id>)
   Adds 1 to the counter of a button. Only ids that exist in the
   click_counters table are accepted. Called by script.js each
   time a button marked with data-track is clicked.
   ========================================================== */
declare(strict_types=1);
define('PIXEL', true);
require __DIR__ . '/inc/helpers.php';
require __DIR__ . '/inc/db.php';

require_method('POST');
start_session();

// Light throttle: max 60 tracked clicks per minute per visitor (stops counter flooding).
$now = time();
if (($_SESSION['track_start'] ?? 0) < $now - 60) {
    $_SESSION['track_start'] = $now;
    $_SESSION['track_count'] = 0;
}
if (++$_SESSION['track_count'] > 60) {
    json_out(['ok' => false, 'message' => 'Too many clicks.'], 429);
}
session_write_close(); // release the session lock: clicks must not slow each other down

$id = $_POST['button'] ?? '';
if (!is_string($id) || !preg_match('/^[a-z0-9-]{1,40}$/', $id)) {
    json_out(['ok' => false, 'message' => 'Invalid button.'], 400);
}

// Atomic increment done by MySQL itself (no read-then-write race between two visitors)
$update = db()->prepare('UPDATE click_counters SET total = total + 1, last_click = ? WHERE button_id = ?');
$update->execute([date('Y-m-d H:i:s'), $id]);

if ($update->rowCount() === 0) {
    json_out(['ok' => false, 'message' => 'Unknown button.'], 404); // not in the whitelist
}

$total = db()->prepare('SELECT total FROM click_counters WHERE button_id = ?');
$total->execute([$id]);

json_out(['ok' => true, 'button' => $id, 'total' => (int) $total->fetchColumn()]);
