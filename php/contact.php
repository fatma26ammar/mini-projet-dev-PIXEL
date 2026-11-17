<?php
/* ==========================================================
   POST php/contact.php
   Receives the contact form (sent by fetch in script.js).
   Checks, in this order:
     1. method   2. same origin   3. CSRF token   4. honeypot
     5. time trap   6. rate limit   7. field validation
   Then: saves the message in MySQL, sends the email,
   and answers with JSON ({ok, message} or {ok:false, errors}).
   ========================================================== */
declare(strict_types=1);
define('PIXEL', true);
require __DIR__ . '/inc/helpers.php';
require __DIR__ . '/inc/db.php';

require_method('POST');
start_session();

// 2. Same origin: a request coming from another website is refused.
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if ($origin !== '' && parse_url($origin, PHP_URL_HOST) !== parse_url('//' . ($_SERVER['HTTP_HOST'] ?? ''), PHP_URL_HOST)) {
    json_out(['ok' => false, 'message' => 'Request refused.'], 403);
}

// 3. CSRF token (obtained from token.php, tied to this visitor's session)
if (!csrf_valid($_POST['csrf_token'] ?? null)) {
    json_out(['ok' => false, 'message' => 'Your session expired. Please reload the page and try again.'], 403);
}

// 4. Honeypot: the field "website" is hidden from humans. If it is filled, a bot did it.
//    We pretend everything went fine so the bot learns nothing, but we save nothing.
if (clean_line($_POST['hp_field'] ?? '') !== '') {
    unset($_SESSION['csrf'], $_SESSION['csrf_time']);
    json_out(['ok' => true, 'message' => 'Thank you! Your message has been sent.'], 201);
}

// 5. Time trap: a form submitted a fraction of a second after loading is a robot.
if (time() - (int) $_SESSION['csrf_time'] < (int) config('min_fill_seconds')) {
    json_out(['ok' => false, 'message' => 'That was very fast! Please wait a moment and send it again.'], 429);
}

// 6. Rate limit: max N messages per visitor in the last X seconds (counted in the database).
$since = date('Y-m-d H:i:s', time() - (int) config('rate_limit_window'));
$count = db()->prepare('SELECT COUNT(*) FROM messages WHERE ip_hash = ? AND created_at >= ?');
$count->execute([visitor_hash(), $since]);
if ((int) $count->fetchColumn() >= (int) config('rate_limit_max')) {
    json_out(['ok' => false, 'message' => 'You have sent several messages already. Please try again in a few minutes.'], 429);
}

// 7. Validate every field (the same rules as script.js, but enforced by the server)
[$data, $errors] = validate_contact($_POST);
if ($errors) {
    json_out(['ok' => false, 'message' => 'Please fix the highlighted fields.', 'errors' => $errors], 422);
}

// --- Save in the database (prepared statement: user input never touches the SQL text) ---
$insert = db()->prepare(
    'INSERT INTO messages (name, email, project, message, ip_hash, created_at)
     VALUES (:name, :email, :project, :message, :ip_hash, :created_at)'
);
$insert->execute([
    ':name'       => $data['name'],
    ':email'      => $data['email'],
    ':project'    => $data['project'],
    ':message'    => $data['message'],
    ':ip_hash'    => visitor_hash(),
    ':created_at' => date('Y-m-d H:i:s'),
]);
$id = (int) db()->lastInsertId();

// The token is single-use: the next message needs a fresh one.
unset($_SESSION['csrf'], $_SESSION['csrf_time']);

// --- Send the notification email (a failure must never lose the message: it is already saved) ---
$sent = send_notification($id, $data);
if ($sent) {
    db()->prepare('UPDATE messages SET mail_sent = 1 WHERE id = ?')->execute([$id]);
}

$firstName = explode(' ', $data['name'])[0];
json_out([
    'ok'      => true,
    'message' => "Thank you, {$firstName}! Your message has been received. We will reply within two working days.",
], 201);


/** Sends a confirmation email to the visitor (the address typed in the form). */
function send_notification(int $id, array $d): bool
{
    $subject = 'We received your message - PIXEL';
    $body = "Hello {$d['name']},\n\n"
          . "Thank you for contacting PIXEL. We have received your message and will reply within two working days.\n\n"
          . "Your message:\n{$d['message']}\n\n"
          . "The PIXEL team\n";

    return send_mail($d['email'], $subject, $body, (string) config('mail_from'));
}

/** Sends one email (or writes it in php/storage/mail.log when mail_mode is 'log'). */
function send_mail(string $to, string $subject, string $body, string $replyTo): bool
{
    // email and name were validated (no line breaks), so they cannot inject extra mail headers
    $headers = [
        'From'         => config('mail_from'),
        'Reply-To'     => $replyTo,
        'MIME-Version' => '1.0',
        'Content-Type' => 'text/plain; charset=UTF-8',
    ];

    if (config('mail_mode') === 'mail') {
        return @mail($to, mb_encode_mimeheader($subject, 'UTF-8'), $body, $headers);
    }

    $entry = str_repeat('=', 60) . "\n" . date('c') . "\nTo: {$to}\nSubject: {$subject}\n\n{$body}\n";
    return file_put_contents(__DIR__ . '/storage/mail.log', $entry, FILE_APPEND | LOCK_EX) !== false;
}
