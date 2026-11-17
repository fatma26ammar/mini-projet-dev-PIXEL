<?php
/* ==========================================================
   PIXEL — shared helpers used by every endpoint
   ========================================================== */
declare(strict_types=1);
defined('PIXEL') or exit;

/** Reads one configuration value. */
function config(string $key)
{
    static $config = null;
    $config ??= require __DIR__ . '/config.php';
    return $config[$key] ?? null;
}

date_default_timezone_set((string) config('timezone'));

/** Sends a JSON answer and stops the script. */
function json_out(array $data, int $status = 200): never
{
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-store');
    header('X-Content-Type-Options: nosniff');
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

/** Any uncaught error (database down, bug...) becomes a clean JSON 500. */
set_exception_handler(function (Throwable $e): void {
    error_log('PIXEL: ' . $e->getMessage() . ' in ' . $e->getFile() . ':' . $e->getLine());
    $out = ['ok' => false, 'message' => 'The server hit a problem. Please try again in a moment.'];
    if (config('debug')) {
        $out['debug'] = $e->getMessage();
    }
    json_out($out, 500);
});

/** Refuses any HTTP method other than the expected one. */
function require_method(string $method): void
{
    if ($_SERVER['REQUEST_METHOD'] !== $method) {
        header('Allow: ' . $method);
        json_out(['ok' => false, 'message' => 'Method not allowed.'], 405);
    }
}

/** Starts the PHP session with safe cookie settings. */
function start_session(): void
{
    if (session_status() === PHP_SESSION_ACTIVE) {
        return;
    }
    session_set_cookie_params([
        'lifetime' => 0,
        'path'     => '/',
        'httponly' => true,       // JavaScript cannot read the cookie
        'samesite' => 'Lax',      // not sent with cross-site POST requests
        'secure'   => !empty($_SERVER['HTTPS']),
    ]);
    session_start();
}

/** HTML-escapes a value for display (used by admin.php). */
function e(string|int|null $value): string
{
    return htmlspecialchars((string) $value, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}

/** Hash of the visitor's IP: lets us rate-limit without storing the address itself. */
function visitor_hash(): string
{
    return hash('sha256', ($_SERVER['REMOTE_ADDR'] ?? 'unknown') . config('ip_salt'));
}

/** Trims, removes control characters, and collapses repeated spaces. */
function clean_line(mixed $value): string
{
    $value = is_string($value) ? $value : '';
    $value = preg_replace('/[\x00-\x1F\x7F]+/u', ' ', $value) ?? '';
    return trim(preg_replace('/\s{2,}/u', ' ', $value) ?? '');
}

/** Same as clean_line() but keeps line breaks (for the message). */
function clean_text(mixed $value): string
{
    $value = is_string($value) ? $value : '';
    $value = str_replace(["\r\n", "\r"], "\n", $value);
    $value = preg_replace('/[^\P{C}\n]+/u', '', $value) ?? ''; // drop control chars except \n
    $value = preg_replace('/\n{3,}/', "\n\n", $value) ?? '';
    return trim($value);
}

/* ---------- CSRF token + "time trap" (both live in the session) ---------- */

/** Returns the current token, creating one if needed. */
function csrf_token(): string
{
    start_session();
    $fresh = isset($_SESSION['csrf'], $_SESSION['csrf_time']) && time() - $_SESSION['csrf_time'] < 3600;
    if (!$fresh) {
        $_SESSION['csrf']      = bin2hex(random_bytes(32));
        $_SESSION['csrf_time'] = time(); // the moment the visitor "saw" the form
    }
    return $_SESSION['csrf'];
}

/** True when the token sent by the browser matches the one stored in the session. */
function csrf_valid(mixed $sent): bool
{
    start_session();
    return is_string($sent)
        && isset($_SESSION['csrf'])
        && hash_equals($_SESSION['csrf'], $sent);
}

/* ---------- Server-side validation of the contact form ---------- */

const PROJECT_TYPES = ['brand', 'uiux', 'web', 'all'];

/**
 * Validates the contact form. Mirrors the rules of script.js, because
 * JavaScript checks can always be bypassed: the server has the last word.
 *
 * @return array{0: array<string,string>, 1: array<string,string>} [clean values, errors per field]
 */
function validate_contact(array $input): array
{
    $v = [
        'name'    => clean_line($input['name'] ?? ''),
        'email'   => clean_line($input['email'] ?? ''),
        'project' => clean_line($input['project'] ?? ''),
        'message' => clean_text($input['message'] ?? ''),
    ];
    $errors = [];

    // Name: 2-80 letters (spaces, hyphens, apostrophes and dots allowed)
    $len = mb_strlen($v['name']);
    if ($v['name'] === '') {
        $errors['name'] = 'Please tell us your name.';
    } elseif ($len < 2 || $len > 80) {
        $errors['name'] = 'Your name needs between 2 and 80 characters.';
    } elseif (!preg_match("/^[\p{L}][\p{L} '’.-]*$/u", $v['name'])) {
        $errors['name'] = 'Please use letters only (spaces, hyphens and apostrophes are fine).';
    }

    // Email
    if ($v['email'] === '') {
        $errors['email'] = 'Please enter your email address.';
    } elseif (strlen($v['email']) > 254 || !filter_var($v['email'], FILTER_VALIDATE_EMAIL)) {
        $errors['email'] = "That email doesn't look right. Try something like name@example.com.";
    }

    // Project type: must be one of the values we offer
    if (!in_array($v['project'], PROJECT_TYPES, true)) {
        $errors['project'] = 'Please choose a project type.';
    }

    // Message: 10-1000 characters, and at most 2 links (typical spam sign)
    $len = mb_strlen($v['message']);
    if ($v['message'] === '') {
        $errors['message'] = 'Please tell us a little about your idea.';
    } elseif ($len < 10) {
        $errors['message'] = 'Add a few more words: at least 10 characters.';
    } elseif ($len > 1000) {
        $errors['message'] = 'Please keep your message under 1000 characters.';
    } elseif (preg_match_all('~https?://|www\.~i', $v['message']) > 2) {
        $errors['message'] = 'Please remove some links: messages with many links are treated as spam.';
    }

    return [$v, $errors];
}
