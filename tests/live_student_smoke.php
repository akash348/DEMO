<?php
// Run on the hosting server; never prints credentials or student records.
$root = getenv('HOME') . '/public_html/pragati-api/src/';
require $root . 'bootstrap.php';
require $root . 'routes.php';
$student = null;
foreach ($pdo->query("SELECT id FROM students WHERE login_enabled = 1 AND status <> 'inactive' ORDER BY id") as $candidate) {
    if (student_portal_permissions($pdo, (int)$candidate['id'])['portal']) { $student = $candidate; break; }
}
if (!$student) { echo "No enabled student account; anonymous access and fixture tests cover the portal.\n"; exit(0); }
$token = create_token($pdo, 'student', null, (int)$student['id'], 1);
try {
    $context = stream_context_create(['http' => ['header' => "Authorization: Bearer " . $token . "\r\n", 'timeout' => 30, 'ignore_errors' => true]]);
    $base = 'https://pragati-institute.co.in/pragati-api/v1/student-auth/';
    $response = file_get_contents($base . 'dashboard', false, $context);
    $data = json_decode($response, true);
    if (!$data || (int)($data['profile']['id'] ?? 0) !== (int)$student['id'] || isset($data['profile']['login_password_hash'])) throw new Exception('Live dashboard check failed.');
    foreach (['fees', 'certificates', 'notes', 'results', 'fee_summary'] as $key) if (!isset($data[$key])) throw new Exception('Missing dashboard section: ' . $key);
    foreach (['certificates', 'fees'] as $kind) {
        if (!empty($data[$kind])) {
            $pdf = file_get_contents($base . $kind . '/' . (int)$data[$kind][0]['id'] . '/pdf', false, $context);
            if (substr($pdf, 0, 5) !== '%PDF-') throw new Exception('Live document download check failed: ' . $kind);
        }
    }
    echo "Live authenticated dashboard and available document PDFs verified.\n";
} finally {
    $stmt = $pdo->prepare('DELETE FROM api_tokens WHERE token = :token');
    $stmt->execute([':token' => $token]);
}
