<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=UTF-8');

const TO_EMAIL = 'info@pobelime.si';
const FROM_EMAIL = 'info@pobelime.si';
const MAX_FILE_SIZE = 8 * 1024 * 1024;
const MAX_TOTAL_SIZE = 20 * 1024 * 1024;
const MAX_FILES = 8;

function respond(bool $ok, string $message, int $status = 200): void
{
    http_response_code($status);
    echo json_encode(['ok' => $ok, 'message' => $message], JSON_UNESCAPED_UNICODE);
    exit;
}

function clean(string $value): string
{
    $value = trim($value);
    return str_replace(["\r", "\n"], ' ', $value);
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    respond(false, 'Napačna metoda.', 405);
}

$ime = clean($_POST['ime'] ?? '');
$email = clean($_POST['email'] ?? '');
$tel = clean($_POST['tel'] ?? '');
$tip = clean($_POST['tip'] ?? '');
$sporocilo = trim((string)($_POST['sporocilo'] ?? ''));

if ($ime === '' || $tip === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    respond(false, 'Prosimo, izpolnite obvezna polja.', 422);
}

$body = "Novo povprasevanje s spletne strani POBELI ME\n\n";
$body .= "Ime in priimek: {$ime}\n";
$body .= "E-posta: {$email}\n";
$body .= "Telefon: " . ($tel !== '' ? $tel : 'Ni vpisan') . "\n";
$body .= "Tip projekta: {$tip}\n\n";
$body .= "Sporocilo:\n" . ($sporocilo !== '' ? $sporocilo : 'Ni vpisano') . "\n";

$attachments = [];
$totalSize = 0;
$allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/heic', 'image/heif'];

if (!empty($_FILES['slike']) && is_array($_FILES['slike']['name'])) {
    $fileCount = count($_FILES['slike']['name']);
    if ($fileCount > MAX_FILES) {
        respond(false, 'Dodate lahko največ 8 fotografij.', 413);
    }
    $finfo = new finfo(FILEINFO_MIME_TYPE);

    for ($i = 0; $i < $fileCount; $i++) {
        $error = $_FILES['slike']['error'][$i];

        if ($error === UPLOAD_ERR_NO_FILE) {
            continue;
        }

        if ($error !== UPLOAD_ERR_OK) {
            respond(false, 'Ene od slik ni bilo mogoče naložiti.', 400);
        }

        $tmpName = $_FILES['slike']['tmp_name'][$i];
        $size = (int)$_FILES['slike']['size'][$i];
        $type = $finfo->file($tmpName) ?: 'application/octet-stream';

        if ($size > MAX_FILE_SIZE) {
            respond(false, 'Posamezna slika je lahko velika največ 8 MB.', 413);
        }

        $totalSize += $size;
        if ($totalSize > MAX_TOTAL_SIZE) {
            respond(false, 'Skupna velikost slik je lahko največ 20 MB.', 413);
        }

        if (!in_array($type, $allowedTypes, true)) {
            respond(false, 'Naložite lahko samo slikovne datoteke.', 415);
        }

        $originalName = basename((string)$_FILES['slike']['name'][$i]);
        $safeName = preg_replace('/[^A-Za-z0-9._-]/', '_', $originalName) ?: 'slika';

        $attachments[] = [
            'path' => $tmpName,
            'name' => $safeName,
            'type' => $type,
        ];
    }
}

$subject = 'Novo povprasevanje - Pobeli Me';
$boundary = 'pobelime_' . bin2hex(random_bytes(16));
$headers = [
    'From: Pobeli Me <' . FROM_EMAIL . '>',
    'Reply-To: ' . $email,
    'MIME-Version: 1.0',
    'Content-Type: multipart/mixed; boundary="' . $boundary . '"',
];

$message = "--{$boundary}\r\n";
$message .= "Content-Type: text/plain; charset=UTF-8\r\n";
$message .= "Content-Transfer-Encoding: 8bit\r\n\r\n";
$message .= $body . "\r\n";

foreach ($attachments as $attachment) {
    $content = chunk_split(base64_encode((string)file_get_contents($attachment['path'])));
    $message .= "--{$boundary}\r\n";
    $message .= "Content-Type: {$attachment['type']}; name=\"{$attachment['name']}\"\r\n";
    $message .= "Content-Transfer-Encoding: base64\r\n";
    $message .= "Content-Disposition: attachment; filename=\"{$attachment['name']}\"\r\n\r\n";
    $message .= $content . "\r\n";
}

$message .= "--{$boundary}--";

if (!mail(TO_EMAIL, $subject, $message, implode("\r\n", $headers))) {
    respond(false, 'Sporočila ni bilo mogoče poslati.', 500);
}

respond(true, 'Povpraševanje je bilo poslano.');
