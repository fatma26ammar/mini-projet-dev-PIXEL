<?php
/* ==========================================================
   GET php/admin.php
   A small password-protected page for the studio: shows the
   saved messages and the click counters.
   Login = admin_user / admin_pass from inc/config.php
   (browser "Basic authentication" prompt).
   ========================================================== */
declare(strict_types=1);
define('PIXEL', true);
require __DIR__ . '/inc/helpers.php';
require __DIR__ . '/inc/db.php';

$user = $_SERVER['PHP_AUTH_USER'] ?? '';
$pass = $_SERVER['PHP_AUTH_PW'] ?? '';
$ok = hash_equals((string) config('admin_user'), $user) && hash_equals((string) config('admin_pass'), $pass);

if (!$ok) {
    header('WWW-Authenticate: Basic realm="PIXEL admin", charset="UTF-8"');
    http_response_code(401);
    exit('Authentication required.');
}

header('X-Robots-Tag: noindex');
header('Cache-Control: no-store');

$messages = db()->query('SELECT id, name, email, project, message, mail_sent, created_at FROM messages ORDER BY id DESC LIMIT 100')->fetchAll();
$buttons  = db()->query('SELECT label, total, last_click FROM click_counters ORDER BY total DESC, label')->fetchAll();
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="robots" content="noindex">
  <title>PIXEL | Admin</title>
  <style>
    body { font: 16px/1.5 system-ui, sans-serif; margin: 0; padding: 2rem 1.25rem; background: #FFFDFB; color: #4D243D; }
    main { max-width: 1000px; margin: 0 auto; }
    h1 { margin-top: 0; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 2.5rem; }
    th, td { text-align: left; padding: .6rem .7rem; border-bottom: 1px solid #F7CACD; vertical-align: top; }
    th { background: #F7CACD; }
    td.msg { white-space: pre-wrap; max-width: 380px; overflow-wrap: anywhere; }
    .empty { color: #6b4a5c; }
  </style>
</head>
<body>
<main>
  <h1>PIXEL admin</h1>

  <h2>Messages (<?= count($messages) ?>)</h2>
  <?php if (!$messages): ?>
    <p class="empty">No message yet.</p>
  <?php else: ?>
    <table>
      <thead><tr><th>#</th><th>Date</th><th>From</th><th>Project</th><th>Message</th><th>Email sent</th></tr></thead>
      <tbody>
      <?php foreach ($messages as $m): ?>
        <tr>
          <td><?= e($m['id']) ?></td>
          <td><?= e($m['created_at']) ?></td>
          <td><?= e($m['name']) ?><br><a href="mailto:<?= e($m['email']) ?>"><?= e($m['email']) ?></a></td>
          <td><?= e($m['project']) ?></td>
          <td class="msg"><?= e($m['message']) ?></td>
          <td><?= $m['mail_sent'] ? 'yes' : 'no' ?></td>
        </tr>
      <?php endforeach; ?>
      </tbody>
    </table>
  <?php endif; ?>

  <h2>Button clicks</h2>
  <table>
    <thead><tr><th>Button</th><th>Clicks</th><th>Last click</th></tr></thead>
    <tbody>
    <?php foreach ($buttons as $b): ?>
      <tr><td><?= e($b['label']) ?></td><td><?= e($b['total']) ?></td><td><?= e($b['last_click'] ?? '-') ?></td></tr>
    <?php endforeach; ?>
    </tbody>
  </table>
</main>
</body>
</html>
