<?php

function student_portal_permissions(PDO $pdo, int $id): array
{
    $defaults = array_fill_keys(['portal', 'profile', 'course', 'notes', 'fees', 'exams', 'results', 'certificates'], true);
    $stmt = $pdo->prepare('SELECT permissions FROM student_portal_access WHERE student_id = :id');
    $stmt->execute([':id' => $id]);
    $saved = json_decode($stmt->fetchColumn() ?: '{}', true);
    return array_replace($defaults, array_intersect_key(is_array($saved) ? $saved : [], $defaults));
}
function require_student_permission(PDO $pdo, array $student, string $section): void
{
    $permissions = student_portal_permissions($pdo, (int)$student['id']);
    if (!$permissions['portal'] || !$permissions[$section]) json_response(['detail' => 'The institute has disabled access to this section.'], 403);
}
function handle_student_access(string $method, int $id, PDO $pdo): void
{
    require_admin($pdo, ['admin']);
    $stmt = $pdo->prepare('SELECT id FROM students WHERE id = :id');
    $stmt->execute([':id' => $id]);
    if (!$stmt->fetch()) not_found();
    if ($method === 'GET') json_response(student_portal_permissions($pdo, $id));
    if ($method === 'PUT') {
        $data = get_json_body();
        $keys = student_portal_permissions($pdo, $id);
        if (array_diff(array_keys($data), array_keys($keys))) bad_request('Unknown access setting.');
        foreach ($data as $value) if (!is_bool($value)) bad_request('Access settings must be true or false.');
        $saved = array_replace($keys, $data);
        $pdo->beginTransaction();
        try {
            $stmt = $pdo->prepare('DELETE FROM student_portal_access WHERE student_id = :id');
            $stmt->execute([':id' => $id]);
            $stmt = $pdo->prepare('INSERT INTO student_portal_access (student_id, permissions) VALUES (:id, :permissions)');
            $stmt->execute([':id' => $id, ':permissions' => json_encode($saved)]);
            if (!$saved['portal']) {
                $stmt = $pdo->prepare('DELETE FROM api_tokens WHERE student_id = :id AND token_type = "student"');
                $stmt->execute([':id' => $id]);
            }
            $pdo->commit();
        } catch (Throwable $e) { $pdo->rollBack(); throw $e; }
        json_response($saved);
    }
    not_found();
}

function student_portal_account(PDO $pdo): array
{
    $student = require_student($pdo);
    if (($student['status'] ?? 'active') === 'inactive') unauthorized();
    require_student_permission($pdo, $student, 'portal');
    return $student;
}

function handle_student_portal(string $method, array $segments, PDO $pdo, array $config): void
{
    $student = student_portal_account($pdo);
    header('Cache-Control: no-store');
    $id = (int)$student['id'];
    $permissions = student_portal_permissions($pdo, $id);
    $action = $segments[1] ?? '';
    if ($method === 'POST' && $action === 'logout') {
        $stmt = $pdo->prepare('DELETE FROM api_tokens WHERE token = :token AND student_id = :id');
        $stmt->execute([':token' => get_bearer_token(), ':id' => $id]);
        json_response(['status' => 'logged_out']);
    }
    if ($method === 'POST' && $action === 'password') {
        $data = get_json_body();
        if (!password_verify($data['current_password'] ?? '', $student['login_password_hash'] ?? '')) {
            json_response(['detail' => 'Current password is incorrect.'], 400);
        }
        $password = $data['new_password'] ?? '';
        if (strlen($password) < 8 || strlen($password) > 72) bad_request('Password must be 8 to 72 characters.');
        $pdo->beginTransaction();
        try {
            $stmt = $pdo->prepare('UPDATE students SET login_password_hash = :hash WHERE id = :id');
            $stmt->execute([':hash' => password_hash($password, PASSWORD_BCRYPT), ':id' => $id]);
            $stmt = $pdo->prepare('DELETE FROM api_tokens WHERE student_id = :id AND token_type = "student"');
            $stmt->execute([':id' => $id]);
            $token = create_token($pdo, 'student', null, $id, (int)$config['auth']['token_ttl_hours']);
            $pdo->commit();
        } catch (Throwable $e) { $pdo->rollBack(); throw $e; }
        json_response(['access_token' => $token, 'token_type' => 'bearer']);
    }
    if ($method === 'GET' && $action === 'dashboard') {
        $profile = array_intersect_key($student, array_flip(['id', 'name', 'father_name', 'enrollment_no', 'dob', 'phone', 'email', 'address', 'photo_url', 'join_date', 'status', 'course_id', 'branch_name']));
        $stmt = $pdo->prepare('SELECT id, title, description, duration, fee FROM courses WHERE id = :id');
        $stmt->execute([':id' => $student['course_id']]);
        $course = $stmt->fetch() ?: null;
        $stmt = $pdo->prepare('SELECT id, amount, mode, paid_on, receipt_no FROM fees WHERE student_id = :id ORDER BY paid_on DESC, id DESC');
        $stmt->execute([':id' => $id]);
        $fees = $stmt->fetchAll();
        $paid = array_sum(array_map(fn($fee) => (float)$fee['amount'], $fees));
        $total = $student['total_fee'] ?? ($course['fee'] ?? null);
        $stmt = $pdo->prepare('SELECT certificates.id, certificate_code, issued_on, grade, percentage, status, courses.title AS course_title FROM certificates LEFT JOIN courses ON courses.id = certificates.course_id WHERE student_id = :id ORDER BY certificates.id DESC');
        $stmt->execute([':id' => $id]);
        $certificates = $stmt->fetchAll();
        $stmt = $pdo->prepare('SELECT id, title, description, original_filename FROM course_notes WHERE is_active = 1 AND (course_id = :course OR course_id IS NULL) ORDER BY id DESC');
        $stmt->execute([':course' => $student['course_id']]);
        $notes = $stmt->fetchAll();
        $stmt = $pdo->prepare('SELECT exam_attempts.id, exam_attempts.status, submitted_at, total_score, exams.title, exams.total_marks, exams.pass_marks FROM exam_attempts JOIN exams ON exams.id = exam_attempts.exam_id WHERE student_id = :id ORDER BY exam_attempts.id DESC');
        $stmt->execute([':id' => $id]);
        if (!$permissions['profile']) $profile = array_intersect_key($profile, array_flip(['id', 'name', 'enrollment_no']));
        if (!$permissions['fees'] && $course) unset($course['fee']);
        json_response(['permissions' => $permissions, 'profile' => $profile, 'course' => $permissions['course'] ? $course : null, 'fees' => $permissions['fees'] ? $fees : [],
            'fee_summary' => $permissions['fees'] ? ['total' => $total === null ? null : (float)$total, 'paid' => $paid, 'balance' => $total === null ? null : max(0, (float)$total - $paid)] : ['total' => null, 'paid' => null, 'balance' => null],
            'notes' => $permissions['notes'] ? $notes : [], 'certificates' => $permissions['certificates'] ? $certificates : [], 'results' => $permissions['results'] ? $stmt->fetchAll() : []]);
    }
    if ($method === 'GET' && $action === 'notes' && ($segments[3] ?? '') === 'download') {
        require_student_permission($pdo, $student, 'notes');
        $stmt = $pdo->prepare('SELECT file_url, original_filename FROM course_notes WHERE id = :id AND is_active = 1 AND (course_id = :course OR course_id IS NULL)');
        $stmt->execute([':id' => (int)($segments[2] ?? 0), ':course' => $student['course_id']]);
        $note = $stmt->fetch();
        $path = $note ? resolve_upload_path($note['file_url'], $config) : null;
        $path = $path ? realpath($path) : false;
        $base = realpath($config['uploads']['base_dir'] ?? '');
        if (!$path || !$base || strpos($path, $base . DIRECTORY_SEPARATOR) !== 0 || !is_file($path)) not_found();
        header('Content-Type: application/octet-stream');
        header('Content-Disposition: attachment; filename="' . preg_replace('/[^A-Za-z0-9._-]/', '_', basename($note['original_filename'])) . '"');
        readfile($path);
        exit;
    }
    if ($method === 'GET' && $action === 'fees' && ($segments[3] ?? '') === 'pdf') {
        require_student_permission($pdo, $student, 'fees');
        $stmt = $pdo->prepare('SELECT fees.*, students.name AS student_name, students.father_name, students.enrollment_no, students.phone, courses.title AS course_title, courses.fee AS course_fee FROM fees JOIN students ON students.id = fees.student_id LEFT JOIN courses ON courses.id = students.course_id WHERE fees.id = :fee AND fees.student_id = :student');
        $stmt->execute([':fee' => (int)($segments[2] ?? 0), ':student' => $id]);
        $fee = $stmt->fetch();
        if (!$fee) not_found();
        $stmt = $pdo->prepare('SELECT COALESCE(SUM(amount), 0) FROM fees WHERE student_id = :student');
        $stmt->execute([':student' => $id]);
        $paid = (float)$stmt->fetchColumn();
        $total = $student['total_fee'] ?? ($fee['course_fee'] ?? null);
        $total = $total === null ? null : (float)$total;
        $pdf = build_receipt_pdf($fee, $paid, $total, $total === null ? null : max(0, $total - $paid), $config);
        header('Content-Type: application/pdf');
        header('Cache-Control: no-store');
        header('Content-Disposition: attachment; filename="receipt-' . (int)$fee['id'] . '.pdf"');
        echo $pdf;
        exit;
    }
    if ($method === 'GET' && $action === 'certificates' && ($segments[3] ?? '') === 'pdf') {
        require_student_permission($pdo, $student, 'certificates');
        $stmt = $pdo->prepare('SELECT certificates.*, students.name AS student_name, students.father_name, students.enrollment_no, students.dob, students.join_date AS student_join_date, students.photo_url, courses.title AS course_title, courses.duration AS course_duration FROM certificates JOIN students ON students.id = certificates.student_id LEFT JOIN courses ON courses.id = certificates.course_id WHERE certificates.id = :cert AND certificates.student_id = :student');
        $stmt->execute([':cert' => (int)($segments[2] ?? 0), ':student' => $id]);
        $cert = $stmt->fetch();
        if (!$cert) not_found();
        $pdf = build_certificate_template_pdf($cert, $config);
        header('Content-Type: application/pdf');
        header('Cache-Control: no-store');
        header('Content-Disposition: attachment; filename="certificate-' . preg_replace('/[^A-Za-z0-9_-]/', '', $cert['certificate_code']) . '.pdf"');
        echo $pdf;
        exit;
    }
    not_found();
}
