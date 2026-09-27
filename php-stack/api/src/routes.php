<?php

function dispatch(string $method, array $segments, PDO $pdo, array $config): void
{
    if (empty($segments)) {
        json_response(['message' => 'Pragati API']);
    }

    switch ($segments[0]) {
        case 'auth':
            handle_auth($method, $segments, $pdo, $config);
            break;
        case 'student-auth':
            handle_student_auth($method, $segments, $pdo, $config);
            break;
        case 'dashboard':
            handle_dashboard($method, $segments, $pdo);
            break;
        case 'trades':
            handle_trades($method, $segments, $pdo);
            break;
        case 'courses':
            handle_courses($method, $segments, $pdo);
            break;
        case 'students':
            handle_students($method, $segments, $pdo, $config);
            break;
        case 'enquiries':
            handle_enquiries($method, $segments, $pdo);
            break;
        case 'admissions':
            handle_admissions($method, $segments, $pdo);
            break;
        case 'faculty':
            handle_faculty($method, $segments, $pdo, $config);
            break;
        case 'notes':
            handle_notes($method, $segments, $pdo, $config);
            break;
        case 'gallery':
            handle_gallery($method, $segments, $pdo, $config);
            break;
        case 'fees':
            handle_fees($method, $segments, $pdo, $config);
            break;
        case 'other-income':
            handle_other_income($method, $segments, $pdo);
            break;
        case 'expenses':
            handle_expenses($method, $segments, $pdo);
            break;
        case 'certificates':
            handle_certificates($method, $segments, $pdo, $config);
            break;
        case 'exams':
            handle_exams($method, $segments, $pdo);
            break;
        default:
            not_found();
    }
}

function handle_auth(string $method, array $segments, PDO $pdo, array $config): void
{
    $action = $segments[1] ?? '';

    if ($method === 'POST' && $action === 'login') {
        $data = get_json_body();
        $email = strtolower(trim($data['email'] ?? ''));
        $password = $data['password'] ?? '';
        if (!$email || !$password) {
            bad_request('Email and password are required.');
        }
        $stmt = $pdo->prepare('SELECT * FROM users WHERE email = :email LIMIT 1');
        $stmt->execute([':email' => $email]);
        $user = $stmt->fetch();
        if (!$user || !password_verify($password, $user['hashed_password'])) {
            unauthorized();
        }
        if (!$user['is_active']) {
            unauthorized();
        }
        $token = create_token($pdo, 'admin', (int)$user['id'], null, (int)$config['auth']['token_ttl_hours']);
        json_response([
            'access_token' => $token,
            'token_type' => 'bearer',
            'user' => [
                'id' => (int)$user['id'],
                'name' => $user['name'],
                'email' => $user['email'],
                'role' => $user['role'] ?? 'admin'
            ]
        ]);
    }

    if ($method === 'POST' && $action === 'register') {
        $data = get_json_body();
        $name = trim($data['name'] ?? '');
        $email = strtolower(trim($data['email'] ?? ''));
        $password = $data['password'] ?? '';
        $role = strtolower(trim((string)($data['role'] ?? 'admin')));

        if (!$name || !$email || !$password) {
            bad_request('Name, email, and password are required.');
        }

        $countStmt = $pdo->query('SELECT COUNT(*) AS total FROM users');
        $totalUsers = (int)($countStmt->fetch()['total'] ?? 0);
        if ($totalUsers > 0) {
            require_admin($pdo);
        }
        $allowedRoles = ['admin', 'approver'];
        if (!in_array($role, $allowedRoles, true)) {
            bad_request('Invalid role.');
        }

        $hash = password_hash($password, PASSWORD_BCRYPT);
        $stmt = $pdo->prepare('INSERT INTO users (name, email, hashed_password, role, is_active) VALUES (:name, :email, :hash, :role, 1)');
        $stmt->execute([
            ':name' => $name,
            ':email' => $email,
            ':hash' => $hash,
            ':role' => $role
        ]);
        json_response(['id' => (int)$pdo->lastInsertId(), 'name' => $name, 'email' => $email, 'role' => $role]);
    }

    if ($method === 'GET' && $action === 'me') {
        $user = require_admin($pdo);
        json_response([
            'id' => (int)$user['id'],
            'name' => $user['name'],
            'email' => $user['email'],
            'role' => $user['role'] ?? 'admin'
        ]);
    }

    not_found();
}

function handle_student_auth(string $method, array $segments, PDO $pdo, array $config): void
{
    $action = $segments[1] ?? '';

    if ($method === 'POST' && $action === 'login') {
        $data = get_json_body();
        $enrollment = trim($data['enrollment_no'] ?? '');
        $password = $data['password'] ?? '';
        if (!$enrollment || !$password) {
            bad_request('Enrollment and password are required.');
        }
        $stmt = $pdo->prepare('SELECT * FROM students WHERE enrollment_no = :enroll LIMIT 1');
        $stmt->execute([':enroll' => $enrollment]);
        $student = $stmt->fetch();
        if (!$student || !$student['login_enabled']) {
            unauthorized();
        }
        if (!$student['login_password_hash'] || !password_verify($password, $student['login_password_hash'])) {
            unauthorized();
        }
        $token = create_token($pdo, 'student', null, (int)$student['id'], (int)$config['auth']['token_ttl_hours']);
        json_response(['access_token' => $token, 'token_type' => 'bearer']);
    }

    if ($method === 'POST' && $action === 'register') {
        $data = get_json_body();
        $enrollment = trim($data['enrollment_no'] ?? '');
        $dob = normalize_date($data['dob'] ?? null);
        $password = $data['password'] ?? '';
        if (!$enrollment || !$dob || !$password) {
            bad_request('Enrollment, DOB, and password are required.');
        }
        $stmt = $pdo->prepare('SELECT * FROM students WHERE enrollment_no = :enroll AND dob = :dob LIMIT 1');
        $stmt->execute([':enroll' => $enrollment, ':dob' => $dob]);
        $student = $stmt->fetch();
        if (!$student) {
            unauthorized();
        }
        $hash = password_hash($password, PASSWORD_BCRYPT);
        $update = $pdo->prepare('UPDATE students SET login_password_hash = :hash, login_enabled = 1 WHERE id = :id');
        $update->execute([':hash' => $hash, ':id' => $student['id']]);
        $token = create_token($pdo, 'student', null, (int)$student['id'], (int)$config['auth']['token_ttl_hours']);
        json_response(['access_token' => $token, 'token_type' => 'bearer']);
    }

    not_found();
}

function handle_dashboard(string $method, array $segments, PDO $pdo): void
{
    if ($method !== 'GET') {
        not_found();
    }

    $action = $segments[1] ?? '';
    if ($action === 'summary') {
        require_admin($pdo);

        $totalStudents = (int)$pdo->query('SELECT COUNT(*) AS total FROM students')->fetch()['total'];
        $totalCourses = (int)$pdo->query('SELECT COUNT(*) AS total FROM courses WHERE is_active = 1')->fetch()['total'];
        $pendingAdmissions = 0;
        try {
            $pendingAdmissions = (int)$pdo
                ->query("SELECT COUNT(*) AS total FROM admissions WHERE status = 'pending'")
                ->fetch()['total'];
        } catch (Throwable $e) {
            $pendingAdmissions = 0;
        }
        $totalEnquiries = (int)$pdo->query('SELECT COUNT(*) AS total FROM enquiries')->fetch()['total'];
        $totalFees = (float)$pdo->query('SELECT COALESCE(SUM(amount),0) AS total FROM fees')->fetch()['total'];
        $totalExpenses = (float)$pdo->query('SELECT COALESCE(SUM(amount),0) AS total FROM expenses')->fetch()['total'];
        $totalCertificates = (int)$pdo->query('SELECT COUNT(*) AS total FROM certificates')->fetch()['total'];

        json_response([
            'total_students' => $totalStudents,
            'total_courses' => $totalCourses,
            'pending_admissions' => $pendingAdmissions,
            'total_enquiries' => $totalEnquiries,
            'total_fees' => $totalFees,
            'total_expenses' => $totalExpenses,
            'total_certificates' => $totalCertificates
        ]);
    }

    if ($action === 'analysis') {
        require_admin($pdo);

        $startDate = date('Y-m-01', strtotime('-5 months'));
        $months = [];
        for ($i = 5; $i >= 0; $i--) {
            $key = date('Y-m', strtotime("-{$i} months"));
            $label = date('M Y', strtotime("-{$i} months"));
            $months[$key] = [
                'month_key' => $key,
                'month' => $label,
                'fees' => 0,
                'other_income' => 0,
                'expenses' => 0
            ];
        }

        $feeStmt = $pdo->prepare(
            'SELECT DATE_FORMAT(COALESCE(paid_on, created_at), "%Y-%m") AS ym, COALESCE(SUM(amount),0) AS total
             FROM fees
             WHERE COALESCE(paid_on, created_at) >= :start
             GROUP BY ym'
        );
        $feeStmt->execute([':start' => $startDate]);
        foreach ($feeStmt->fetchAll() as $row) {
            $key = $row['ym'];
            if (isset($months[$key])) {
                $months[$key]['fees'] = (float)$row['total'];
            }
        }

        $otherStmt = $pdo->prepare(
            'SELECT DATE_FORMAT(COALESCE(paid_on, created_at), "%Y-%m") AS ym, COALESCE(SUM(amount),0) AS total
             FROM other_incomes
             WHERE COALESCE(paid_on, created_at) >= :start
             GROUP BY ym'
        );
        $otherStmt->execute([':start' => $startDate]);
        foreach ($otherStmt->fetchAll() as $row) {
            $key = $row['ym'];
            if (isset($months[$key])) {
                $months[$key]['other_income'] = (float)$row['total'];
            }
        }

        $expenseStmt = $pdo->prepare(
            'SELECT DATE_FORMAT(COALESCE(paid_on, created_at), "%Y-%m") AS ym, COALESCE(SUM(amount),0) AS total
             FROM expenses
             WHERE COALESCE(paid_on, created_at) >= :start
             GROUP BY ym'
        );
        $expenseStmt->execute([':start' => $startDate]);
        foreach ($expenseStmt->fetchAll() as $row) {
            $key = $row['ym'];
            if (isset($months[$key])) {
                $months[$key]['expenses'] = (float)$row['total'];
            }
        }

        $series = array_values(array_map(function ($item) {
            $item['total_income'] = $item['fees'] + $item['other_income'];
            $item['net'] = $item['total_income'] - $item['expenses'];
            return $item;
        }, $months));

        json_response(['months' => $series]);
    }

    not_found();
}

function handle_trades(string $method, array $segments, PDO $pdo): void
{
    if ($method === 'GET' && count($segments) === 1) {
        $activeOnly = parse_bool($_GET['active_only'] ?? 'true');
        if ($activeOnly === null) {
            $activeOnly = true;
        }
        if (!$activeOnly) {
            require_admin($pdo);
        }
        if ($activeOnly) {
            $stmt = $pdo->query('SELECT * FROM trades WHERE is_active = 1 ORDER BY created_at DESC');
        } else {
            $stmt = $pdo->query('SELECT * FROM trades ORDER BY created_at DESC');
        }
        json_response($stmt->fetchAll());
    }

    if ($method === 'POST' && count($segments) === 1) {
        require_admin($pdo);
        $data = get_json_body();
        $name = trim($data['name'] ?? '');
        if (!$name) {
            bad_request('Trade name is required.');
        }
        $description = $data['description'] ?? null;
        $isActive = parse_bool($data['is_active'] ?? 'true');
        $stmt = $pdo->prepare('INSERT INTO trades (name, description, is_active) VALUES (:name, :description, :is_active)');
        $stmt->execute([
            ':name' => $name,
            ':description' => $description,
            ':is_active' => $isActive ? 1 : 0
        ]);
        json_response(['id' => (int)$pdo->lastInsertId(), 'name' => $name, 'description' => $description, 'is_active' => $isActive], 201);
    }

    if (count($segments) === 2) {
        $tradeId = (int)$segments[1];
        if ($tradeId <= 0) {
            not_found();
        }

        if ($method === 'PUT') {
            require_admin($pdo);
            $data = get_json_body();
            $fields = [
                'name' => trim($data['name'] ?? ''),
                'description' => $data['description'] ?? null,
                'is_active' => parse_bool($data['is_active'] ?? 'true') ? 1 : 0
            ];
            if (!$fields['name']) {
                bad_request('Trade name is required.');
            }
            $stmt = $pdo->prepare('UPDATE trades SET name = :name, description = :description, is_active = :is_active WHERE id = :id');
            $stmt->execute([
                ':name' => $fields['name'],
                ':description' => $fields['description'],
                ':is_active' => $fields['is_active'],
                ':id' => $tradeId
            ]);
            json_response(['id' => $tradeId] + $fields);
        }

        if ($method === 'DELETE') {
            require_admin($pdo);
            $stmt = $pdo->prepare('DELETE FROM trades WHERE id = :id');
            $stmt->execute([':id' => $tradeId]);
            json_response(['status' => 'deleted']);
        }
    }

    not_found();
}

function handle_courses(string $method, array $segments, PDO $pdo): void
{
    if ($method === 'GET' && count($segments) === 1) {
        $activeOnly = parse_bool($_GET['active_only'] ?? null);
        if ($activeOnly === null) {
            $activeOnly = true;
        }
        if (!$activeOnly) {
            require_admin($pdo);
        }
        if ($activeOnly) {
            $stmt = $pdo->query('SELECT * FROM courses WHERE is_active = 1 ORDER BY created_at DESC');
        } else {
            $stmt = $pdo->query('SELECT * FROM courses ORDER BY created_at DESC');
        }
        json_response($stmt->fetchAll());
    }

    if ($method === 'GET' && count($segments) === 2) {
        $courseId = (int)$segments[1];
        $stmt = $pdo->prepare('SELECT * FROM courses WHERE id = :id LIMIT 1');
        $stmt->execute([':id' => $courseId]);
        $course = $stmt->fetch();
        if (!$course) {
            not_found();
        }
        json_response($course);
    }

    if ($method === 'POST' && count($segments) === 1) {
        require_admin($pdo);
        $data = get_json_body();
        $title = trim($data['title'] ?? '');
        if (!$title) {
            bad_request('Course title is required.');
        }
        $stmt = $pdo->prepare('INSERT INTO courses (trade_id, title, description, duration, fee, is_active) VALUES (:trade_id, :title, :description, :duration, :fee, :is_active)');
        $stmt->execute([
            ':trade_id' => $data['trade_id'] ?? null,
            ':title' => $title,
            ':description' => $data['description'] ?? null,
            ':duration' => $data['duration'] ?? null,
            ':fee' => $data['fee'] ?? null,
            ':is_active' => parse_bool($data['is_active'] ?? 'true') ? 1 : 0
        ]);
        json_response(['id' => (int)$pdo->lastInsertId(), 'title' => $title], 201);
    }

    if (count($segments) === 2) {
        $courseId = (int)$segments[1];
        if ($method === 'PUT') {
            require_admin($pdo);
            $data = get_json_body();
            $title = trim($data['title'] ?? '');
            if (!$title) {
                bad_request('Course title is required.');
            }
            $stmt = $pdo->prepare('UPDATE courses SET trade_id = :trade_id, title = :title, description = :description, duration = :duration, fee = :fee, is_active = :is_active WHERE id = :id');
            $stmt->execute([
                ':trade_id' => $data['trade_id'] ?? null,
                ':title' => $title,
                ':description' => $data['description'] ?? null,
                ':duration' => $data['duration'] ?? null,
                ':fee' => $data['fee'] ?? null,
                ':is_active' => parse_bool($data['is_active'] ?? 'true') ? 1 : 0,
                ':id' => $courseId
            ]);
            json_response(['id' => $courseId, 'title' => $title]);
        }

        if ($method === 'DELETE') {
            require_admin($pdo);
            $stmt = $pdo->prepare('DELETE FROM courses WHERE id = :id');
            $stmt->execute([':id' => $courseId]);
            json_response(['status' => 'deleted']);
        }
    }

    not_found();
}

function handle_students(string $method, array $segments, PDO $pdo, array $config): void
{
    if ($method === 'GET' && count($segments) === 1) {
        require_admin($pdo);
        $stmt = $pdo->query('SELECT * FROM students ORDER BY created_at DESC');
        json_response($stmt->fetchAll());
    }

    if ($method === 'POST' && count($segments) === 1) {
        require_admin($pdo);
        $data = get_json_body();
        $name = trim($data['name'] ?? '');
        $phone = trim($data['phone'] ?? '');
        if (!$name || !$phone) {
            bad_request('Student name and phone are required.');
        }
        $branchName = trim($data['branch_name'] ?? '');
        if ($branchName === '') {
            $branchName = null;
        }
        $courseId = $data['course_id'] ?? null;
        if ($courseId === '' || $courseId === null) {
            $courseId = null;
        } else {
            $courseId = (int)$courseId;
        }
        $tradeName = resolve_trade_name($pdo, null, $courseId);
        $enrollment = trim($data['enrollment_no'] ?? '');
        if (!$enrollment) {
            $enrollment = generate_enrollment_no($pdo, $branchName, $tradeName);
        }
        $totalFee = $data['total_fee'] ?? null;
        if ($totalFee === '') {
            $totalFee = null;
        }
        $stmt = $pdo->prepare('INSERT INTO students (enrollment_no, name, father_name, phone, email, address, course_id, branch_name, total_fee, dob, photo_url, login_enabled, join_date, status) VALUES (:enroll, :name, :father_name, :phone, :email, :address, :course_id, :branch_name, :total_fee, :dob, :photo_url, 0, :join_date, :status)');
        $stmt->execute([
            ':enroll' => $enrollment,
            ':name' => $name,
            ':father_name' => $data['father_name'] ?? null,
            ':phone' => $phone,
            ':email' => $data['email'] ?? null,
            ':address' => $data['address'] ?? null,
            ':course_id' => $courseId,
            ':branch_name' => $branchName,
            ':total_fee' => $totalFee,
            ':dob' => normalize_date($data['dob'] ?? null),
            ':photo_url' => $data['photo_url'] ?? null,
            ':join_date' => normalize_date($data['join_date'] ?? null),
            ':status' => $data['status'] ?? 'active'
        ]);
        json_response(['id' => (int)$pdo->lastInsertId(), 'enrollment_no' => $enrollment]);
    }

    if ($method === 'POST' && ($segments[1] ?? '') === 'upload') {
        require_admin($pdo);
        $name = trim($_POST['name'] ?? '');
        $phone = trim($_POST['phone'] ?? '');
        if (!$name || !$phone) {
            bad_request('Student name and phone are required.');
        }
        if (!isset($_FILES['photo'])) {
            bad_request('Student photo is required.');
        }
        $upload = handle_upload($_FILES['photo'], 'students', $config);
        $branchName = trim($_POST['branch_name'] ?? '');
        if ($branchName === '') {
            $branchName = null;
        }
        $courseId = $_POST['course_id'] ?? null;
        if ($courseId === '' || $courseId === null) {
            $courseId = null;
        } else {
            $courseId = (int)$courseId;
        }
        $tradeName = resolve_trade_name($pdo, null, $courseId);
        $enrollment = trim($_POST['enrollment_no'] ?? '');
        if (!$enrollment) {
            $enrollment = generate_enrollment_no($pdo, $branchName, $tradeName);
        }
        $totalFee = $_POST['total_fee'] ?? null;
        if ($totalFee === '') {
            $totalFee = null;
        }
        $stmt = $pdo->prepare('INSERT INTO students (enrollment_no, name, father_name, phone, email, address, course_id, branch_name, total_fee, dob, photo_url, login_enabled, join_date, status) VALUES (:enroll, :name, :father_name, :phone, :email, :address, :course_id, :branch_name, :total_fee, :dob, :photo_url, 0, :join_date, :status)');
        $stmt->execute([
            ':enroll' => $enrollment,
            ':name' => $name,
            ':father_name' => $_POST['father_name'] ?? null,
            ':phone' => $phone,
            ':email' => $_POST['email'] ?? null,
            ':address' => $_POST['address'] ?? null,
            ':course_id' => $courseId,
            ':branch_name' => $branchName,
            ':total_fee' => $totalFee,
            ':dob' => normalize_date($_POST['dob'] ?? null),
            ':photo_url' => $upload['url'],
            ':join_date' => normalize_date($_POST['join_date'] ?? null),
            ':status' => $_POST['status'] ?? 'active'
        ]);
        json_response(['id' => (int)$pdo->lastInsertId(), 'enrollment_no' => $enrollment, 'photo_url' => $upload['url']]);
    }

    if (count($segments) >= 2) {
        $studentId = (int)$segments[1];
        if ($studentId <= 0) {
            not_found();
        }

        if ($method === 'PUT') {
            require_admin($pdo);
            $data = get_json_body();
            $totalFee = $data['total_fee'] ?? null;
            if ($totalFee === '') {
                $totalFee = null;
            }
            $stmt = $pdo->prepare('UPDATE students SET enrollment_no = :enroll, name = :name, father_name = :father_name, phone = :phone, email = :email, address = :address, course_id = :course_id, branch_name = :branch_name, total_fee = :total_fee, dob = :dob, join_date = :join_date, status = :status WHERE id = :id');
            $stmt->execute([
                ':enroll' => $data['enrollment_no'] ?? null,
                ':name' => $data['name'] ?? null,
                ':father_name' => $data['father_name'] ?? null,
                ':phone' => $data['phone'] ?? null,
                ':email' => $data['email'] ?? null,
                ':address' => $data['address'] ?? null,
                ':course_id' => $data['course_id'] ?? null,
                ':branch_name' => $data['branch_name'] ?? null,
                ':total_fee' => $totalFee,
                ':dob' => normalize_date($data['dob'] ?? null),
                ':join_date' => normalize_date($data['join_date'] ?? null),
                ':status' => $data['status'] ?? 'active',
                ':id' => $studentId
            ]);
            json_response(['status' => 'updated']);
        }

        if ($method === 'DELETE') {
            require_admin($pdo);
            $stmt = $pdo->prepare('DELETE FROM students WHERE id = :id');
            $stmt->execute([':id' => $studentId]);
            json_response(['status' => 'deleted']);
        }

        if ($method === 'POST' && ($segments[2] ?? '') === 'photo') {
            require_admin($pdo);
            if (!isset($_FILES['photo'])) {
                bad_request('Photo is required.');
            }
            $upload = handle_upload($_FILES['photo'], 'students', $config);
            $stmt = $pdo->prepare('UPDATE students SET photo_url = :photo WHERE id = :id');
            $stmt->execute([':photo' => $upload['url'], ':id' => $studentId]);
            json_response(['photo_url' => $upload['url']]);
        }

        if ($method === 'POST' && ($segments[2] ?? '') === 'set-password') {
            require_admin($pdo);
            $password = $_POST['password'] ?? null;
            if (!$password) {
                bad_request('Password is required.');
            }
            $hash = password_hash($password, PASSWORD_BCRYPT);
            $stmt = $pdo->prepare('UPDATE students SET login_password_hash = :hash, login_enabled = 1 WHERE id = :id');
            $stmt->execute([':hash' => $hash, ':id' => $studentId]);
            json_response(['status' => 'updated']);
        }
    }

    not_found();
}

function handle_enquiries(string $method, array $segments, PDO $pdo): void
{
    if ($method === 'POST' && count($segments) === 1) {
        $data = get_json_body();
        $name = trim($data['name'] ?? '');
        $phone = trim($data['phone'] ?? '');
        if (!$name || !$phone) {
            bad_request('Name and phone are required.');
        }
        $stmt = $pdo->prepare('INSERT INTO enquiries (name, phone, email, message, source) VALUES (:name, :phone, :email, :message, :source)');
        $stmt->execute([
            ':name' => $name,
            ':phone' => $phone,
            ':email' => $data['email'] ?? null,
            ':message' => $data['message'] ?? null,
            ':source' => $data['source'] ?? 'website'
        ]);
        json_response(['status' => 'created'], 201);
    }

    if ($method === 'GET' && count($segments) === 1) {
        require_admin($pdo);
        $stmt = $pdo->query('SELECT * FROM enquiries ORDER BY created_at DESC');
        json_response($stmt->fetchAll());
    }

    if ($method === 'DELETE' && count($segments) === 2) {
        require_admin($pdo);
        $enquiryId = (int)$segments[1];
        $stmt = $pdo->prepare('DELETE FROM enquiries WHERE id = :id');
        $stmt->execute([':id' => $enquiryId]);
        json_response(['status' => 'deleted']);
    }

    not_found();
}

function handle_admissions(string $method, array $segments, PDO $pdo): void
{
    if ($method === 'POST' && count($segments) === 1) {
        $data = get_json_body();
        $name = trim($data['name'] ?? '');
        $phone = trim($data['phone'] ?? '');
        if (!$name || !$phone) {
            bad_request('Name and phone are required.');
        }
        $stmt = $pdo->prepare('INSERT INTO admissions (course_id, trade_id, course_title, course_fee, course_duration, trade_name, branch_name, name, phone, email, guardian_name, qualification, address, preferred_batch, notes, status) VALUES (:course_id, :trade_id, :course_title, :course_fee, :course_duration, :trade_name, :branch_name, :name, :phone, :email, :guardian_name, :qualification, :address, :preferred_batch, :notes, "pending")');
        $stmt->execute([
            ':course_id' => $data['course_id'] ?? null,
            ':trade_id' => $data['trade_id'] ?? null,
            ':course_title' => $data['course_title'] ?? null,
            ':course_fee' => $data['course_fee'] ?? null,
            ':course_duration' => $data['course_duration'] ?? null,
            ':trade_name' => $data['trade_name'] ?? null,
            ':branch_name' => $data['branch_name'] ?? null,
            ':name' => $name,
            ':phone' => $phone,
            ':email' => $data['email'] ?? null,
            ':guardian_name' => $data['guardian_name'] ?? null,
            ':qualification' => $data['qualification'] ?? null,
            ':address' => $data['address'] ?? null,
            ':preferred_batch' => $data['preferred_batch'] ?? null,
            ':notes' => $data['notes'] ?? null
        ]);
        json_response(['status' => 'created'], 201);
    }

    if ($method === 'GET' && count($segments) === 1) {
        require_admin($pdo);
        $status = $_GET['status'] ?? null;
        try {
            if ($status && $status !== 'all') {
                $stmt = $pdo->prepare('SELECT * FROM admissions WHERE status = :status ORDER BY created_at DESC');
                $stmt->execute([':status' => $status]);
            } else {
                $stmt = $pdo->query('SELECT * FROM admissions ORDER BY created_at DESC');
            }
            json_response($stmt->fetchAll());
        } catch (Throwable $e) {
            json_response([]);
        }
    }

    if (count($segments) >= 3) {
        $admissionId = (int)$segments[1];
        $action = $segments[2];

        if ($method === 'POST' && $action === 'approve') {
            require_admin($pdo);
            $data = get_json_body();
            $stmt = $pdo->prepare('SELECT * FROM admissions WHERE id = :id LIMIT 1');
            $stmt->execute([':id' => $admissionId]);
            $admission = $stmt->fetch();
            if (!$admission) {
                not_found();
            }
            $branchName = $admission['branch_name'] ?? null;
            $tradeName = $admission['trade_name'] ?? null;
            if (!$tradeName) {
                $tradeName = resolve_trade_name(
                    $pdo,
                    isset($admission['trade_id']) ? (int)$admission['trade_id'] : null,
                    isset($admission['course_id']) ? (int)$admission['course_id'] : null
                );
            }
            $enrollment = trim($data['enrollment_no'] ?? '');
            if (!$enrollment) {
                $enrollment = generate_enrollment_no($pdo, $branchName, $tradeName);
            }
            $password = $data['password'] ?? '';
            if (!$password) {
                bad_request('Password is required.');
            }
            $hash = password_hash($password, PASSWORD_BCRYPT);
            $joinDate = normalize_date($data['join_date'] ?? null) ?? date('Y-m-d');

            $pdo->beginTransaction();
            $studentStmt = $pdo->prepare('INSERT INTO students (enrollment_no, name, father_name, phone, email, address, course_id, branch_name, total_fee, join_date, status, login_password_hash, login_enabled) VALUES (:enroll, :name, :father_name, :phone, :email, :address, :course_id, :branch_name, :total_fee, :join_date, "active", :hash, 1)');
            $studentStmt->execute([
                ':enroll' => $enrollment,
                ':name' => $admission['name'],
                ':father_name' => $admission['guardian_name'] ?? null,
                ':phone' => $admission['phone'],
                ':email' => $admission['email'] ?? null,
                ':address' => $admission['address'] ?? null,
                ':course_id' => $admission['course_id'] ?? null,
                ':branch_name' => $branchName,
                ':total_fee' => $admission['course_fee'] ?? null,
                ':join_date' => $joinDate,
                ':hash' => $hash
            ]);
            $studentId = (int)$pdo->lastInsertId();

            $update = $pdo->prepare('UPDATE admissions SET status = "approved", status_note = :note, student_id = :student_id, approved_at = NOW(), updated_at = NOW() WHERE id = :id');
            $update->execute([
                ':note' => $data['status_note'] ?? null,
                ':student_id' => $studentId,
                ':id' => $admissionId
            ]);
            $pdo->commit();

            json_response(['status' => 'approved', 'student' => ['id' => $studentId, 'enrollment_no' => $enrollment]]);
        }

        if ($method === 'POST' && $action === 'reject') {
            require_admin($pdo);
            $data = get_json_body();
            $stmt = $pdo->prepare('UPDATE admissions SET status = "rejected", status_note = :note, rejected_at = NOW(), updated_at = NOW() WHERE id = :id');
            $stmt->execute([':note' => $data['status_note'] ?? null, ':id' => $admissionId]);
            json_response(['status' => 'rejected']);
        }
    }

    if ($method === 'DELETE' && count($segments) === 2) {
        require_admin($pdo);
        $admissionId = (int)$segments[1];
        $stmt = $pdo->prepare('DELETE FROM admissions WHERE id = :id');
        $stmt->execute([':id' => $admissionId]);
        json_response(['status' => 'deleted']);
    }

    not_found();
}

function handle_faculty(string $method, array $segments, PDO $pdo, array $config): void
{
    if ($method === 'GET' && count($segments) === 1) {
        $activeOnly = parse_bool($_GET['active_only'] ?? null);
        if ($activeOnly === null) {
            $activeOnly = true;
        }
        if (!$activeOnly) {
            require_admin($pdo);
        }
        if ($activeOnly) {
            $stmt = $pdo->query('SELECT * FROM faculty WHERE is_active = 1 ORDER BY sort_order ASC, created_at DESC');
        } else {
            $stmt = $pdo->query('SELECT * FROM faculty ORDER BY sort_order ASC, created_at DESC');
        }
        json_response($stmt->fetchAll());
    }

    if ($method === 'POST' && count($segments) === 1) {
        require_admin($pdo);
        $data = get_json_body();
        $name = trim($data['name'] ?? '');
        $designation = trim($data['designation'] ?? '');
        if (!$name || !$designation) {
            bad_request('Name and designation are required.');
        }
        $stmt = $pdo->prepare('INSERT INTO faculty (name, designation, department, experience, expertise, qualification, phone, email, bio, achievements, linkedin_url, join_date, sort_order, is_active) VALUES (:name, :designation, :department, :experience, :expertise, :qualification, :phone, :email, :bio, :achievements, :linkedin_url, :join_date, :sort_order, :is_active)');
        $stmt->execute([
            ':name' => $name,
            ':designation' => $designation,
            ':department' => $data['department'] ?? null,
            ':experience' => $data['experience'] ?? null,
            ':expertise' => $data['expertise'] ?? null,
            ':qualification' => $data['qualification'] ?? null,
            ':phone' => $data['phone'] ?? null,
            ':email' => $data['email'] ?? null,
            ':bio' => $data['bio'] ?? null,
            ':achievements' => $data['achievements'] ?? null,
            ':linkedin_url' => $data['linkedin_url'] ?? null,
            ':join_date' => normalize_date($data['join_date'] ?? null),
            ':sort_order' => $data['sort_order'] ?? 0,
            ':is_active' => parse_bool($data['is_active'] ?? 'true') ? 1 : 0
        ]);
        json_response(['id' => (int)$pdo->lastInsertId(), 'name' => $name], 201);
    }

    if (count($segments) >= 2) {
        $facultyId = (int)$segments[1];
        if ($facultyId <= 0) {
            not_found();
        }

        if ($method === 'PUT') {
            require_admin($pdo);
            $data = get_json_body();
            $stmt = $pdo->prepare('UPDATE faculty SET name = :name, designation = :designation, department = :department, experience = :experience, expertise = :expertise, qualification = :qualification, phone = :phone, email = :email, bio = :bio, achievements = :achievements, linkedin_url = :linkedin_url, join_date = :join_date, sort_order = :sort_order, is_active = :is_active WHERE id = :id');
            $stmt->execute([
                ':name' => $data['name'] ?? null,
                ':designation' => $data['designation'] ?? null,
                ':department' => $data['department'] ?? null,
                ':experience' => $data['experience'] ?? null,
                ':expertise' => $data['expertise'] ?? null,
                ':qualification' => $data['qualification'] ?? null,
                ':phone' => $data['phone'] ?? null,
                ':email' => $data['email'] ?? null,
                ':bio' => $data['bio'] ?? null,
                ':achievements' => $data['achievements'] ?? null,
                ':linkedin_url' => $data['linkedin_url'] ?? null,
                ':join_date' => normalize_date($data['join_date'] ?? null),
                ':sort_order' => $data['sort_order'] ?? 0,
                ':is_active' => parse_bool($data['is_active'] ?? 'true') ? 1 : 0,
                ':id' => $facultyId
            ]);
            json_response(['status' => 'updated']);
        }

        if ($method === 'DELETE') {
            require_admin($pdo);
            $stmt = $pdo->prepare('DELETE FROM faculty WHERE id = :id');
            $stmt->execute([':id' => $facultyId]);
            json_response(['status' => 'deleted']);
        }

        if ($method === 'POST' && ($segments[2] ?? '') === 'photo') {
            require_admin($pdo);
            if (!isset($_FILES['photo'])) {
                bad_request('Photo is required.');
            }
            $upload = handle_upload($_FILES['photo'], 'faculty', $config);
            $stmt = $pdo->prepare('UPDATE faculty SET photo_url = :photo WHERE id = :id');
            $stmt->execute([':photo' => $upload['url'], ':id' => $facultyId]);
            json_response(['photo_url' => $upload['url']]);
        }
    }

    not_found();
}

function handle_notes(string $method, array $segments, PDO $pdo, array $config): void
{
    if ($method === 'GET' && count($segments) === 1) {
        $courseId = $_GET['course_id'] ?? null;
        $activeOnly = parse_bool($_GET['active_only'] ?? null);
        if ($activeOnly === null) {
            $activeOnly = true;
        }
        if (!$activeOnly) {
            require_admin($pdo);
        }
        $query = 'SELECT * FROM course_notes';
        $params = [];
        $clauses = [];
        if ($activeOnly) {
            $clauses[] = 'is_active = 1';
        }
        if ($courseId) {
            $clauses[] = 'course_id = :course_id';
            $params[':course_id'] = $courseId;
        }
        if ($clauses) {
            $query .= ' WHERE ' . implode(' AND ', $clauses);
        }
        $query .= ' ORDER BY created_at DESC';
        $stmt = $pdo->prepare($query);
        $stmt->execute($params);
        json_response($stmt->fetchAll());
    }

    if ($method === 'POST' && ($segments[1] ?? '') === 'upload') {
        require_admin($pdo);
        if (!isset($_FILES['file'])) {
            bad_request('File is required.');
        }
        $upload = handle_upload($_FILES['file'], 'notes', $config);
        $title = trim($_POST['title'] ?? '');
        if (!$title) {
            $title = pathinfo($upload['original'], PATHINFO_FILENAME);
        }
        $stmt = $pdo->prepare('INSERT INTO course_notes (title, description, file_url, original_filename, file_type, course_id, is_active) VALUES (:title, :description, :file_url, :original_filename, :file_type, :course_id, 1)');
        $stmt->execute([
            ':title' => $title,
            ':description' => $_POST['description'] ?? null,
            ':file_url' => $upload['url'],
            ':original_filename' => $upload['original'],
            ':file_type' => $upload['type'],
            ':course_id' => $_POST['course_id'] ?? null
        ]);
        json_response(['id' => (int)$pdo->lastInsertId(), 'file_url' => $upload['url']], 201);
    }

    not_found();
}

function handle_gallery(string $method, array $segments, PDO $pdo, array $config): void
{
    if ($method === 'GET' && count($segments) === 1) {
        $activeOnly = parse_bool($_GET['active_only'] ?? null);
        if ($activeOnly === null) {
            $activeOnly = true;
        }
        if (!$activeOnly) {
            require_admin($pdo);
        }
        if ($activeOnly) {
            $stmt = $pdo->query('SELECT * FROM gallery WHERE is_active = 1 ORDER BY created_at DESC');
        } else {
            $stmt = $pdo->query('SELECT * FROM gallery ORDER BY created_at DESC');
        }
        json_response($stmt->fetchAll());
    }

    if ($method === 'POST' && ($segments[1] ?? '') === 'upload') {
        require_admin($pdo);
        if (!isset($_FILES['file'])) {
            bad_request('File is required.');
        }
        $upload = handle_upload($_FILES['file'], 'gallery', $config);
        $mediaType = $_POST['media_type'] ?? 'auto';
        if ($mediaType === 'auto') {
            $mediaType = str_starts_with($upload['type'] ?? '', 'video') ? 'video' : 'photo';
        }
        $stmt = $pdo->prepare('INSERT INTO gallery (media_type, title, url, is_active) VALUES (:media_type, :title, :url, :is_active)');
        $stmt->execute([
            ':media_type' => $mediaType,
            ':title' => $_POST['title'] ?? null,
            ':url' => $upload['url'],
            ':is_active' => parse_bool($_POST['is_active'] ?? 'true') ? 1 : 0
        ]);
        json_response(['id' => (int)$pdo->lastInsertId(), 'url' => $upload['url']], 201);
    }

    if ($method === 'PUT' && count($segments) === 2) {
        require_admin($pdo);
        $itemId = (int)$segments[1];
        $data = get_json_body();
        $stmt = $pdo->prepare('UPDATE gallery SET title = :title, media_type = :media_type, is_active = :is_active WHERE id = :id');
        $stmt->execute([
            ':title' => $data['title'] ?? null,
            ':media_type' => $data['media_type'] ?? 'photo',
            ':is_active' => parse_bool($data['is_active'] ?? 'true') ? 1 : 0,
            ':id' => $itemId
        ]);
        json_response(['status' => 'updated']);
    }

    if ($method === 'DELETE' && count($segments) === 2) {
        require_admin($pdo);
        $itemId = (int)$segments[1];
        $stmt = $pdo->prepare('DELETE FROM gallery WHERE id = :id');
        $stmt->execute([':id' => $itemId]);
        json_response(['status' => 'deleted']);
    }

    not_found();
}

function format_receipt_amount($value): string
{
    if ($value === null || $value === '') {
        return 'NA';
    }
    $amount = (float)$value;
    return 'Rs. ' . number_format($amount, 2, '.', '');
}

function receipt_amount_words($value): string
{
    if ($value === null || $value === '') {
        return 'NA';
    }
    $number = (int)round((float)$value);
    if ($number === 0) {
        return 'Zero Rupees Only';
    }
    $ones = [
        '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
        'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
        'Seventeen', 'Eighteen', 'Nineteen'
    ];
    $tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    $twoDigits = function (int $n) use ($ones, $tens): string {
        if ($n < 20) {
            return $ones[$n];
        }
        return trim($tens[intdiv($n, 10)] . ' ' . $ones[$n % 10]);
    };
    $threeDigits = function (int $n) use ($ones, $twoDigits): string {
        $text = '';
        if ($n >= 100) {
            $text .= $ones[intdiv($n, 100)] . ' Hundred';
            $n %= 100;
            if ($n > 0) {
                $text .= ' ';
            }
        }
        if ($n > 0) {
            $text .= $twoDigits($n);
        }
        return trim($text);
    };
    $parts = [];
    $crore = intdiv($number, 10000000);
    if ($crore > 0) {
        $parts[] = $threeDigits($crore) . ' Crore';
        $number %= 10000000;
    }
    $lakh = intdiv($number, 100000);
    if ($lakh > 0) {
        $parts[] = $threeDigits($lakh) . ' Lakh';
        $number %= 100000;
    }
    $thousand = intdiv($number, 1000);
    if ($thousand > 0) {
        $parts[] = $threeDigits($thousand) . ' Thousand';
        $number %= 1000;
    }
    if ($number > 0) {
        $parts[] = $threeDigits($number);
    }
    return trim(implode(' ', $parts)) . ' Rupees Only';
}

function format_certificate_date(?string $value): ?string
{
    if (!$value) {
        return null;
    }
    $value = substr((string)$value, 0, 10);
    $timestamp = strtotime($value);
    if ($timestamp === false) {
        return $value;
    }
    return date('d-m-Y', $timestamp);
}

function certificate_from_date_source(array $cert): ?string
{
    if (!empty($cert['from_date'])) {
        return (string)$cert['from_date'];
    }
    if (!empty($cert['student_join_date'])) {
        return (string)$cert['student_join_date'];
    }
    if (empty($cert['issued_on']) || empty($cert['course_duration'])) {
        return null;
    }

    $issued = new DateTimeImmutable(substr((string)$cert['issued_on'], 0, 10));
    $duration = strtolower((string)$cert['course_duration']);
    if (preg_match('/(\d+)\s*(month|months)/', $duration, $match)) {
        return $issued->modify('-' . (int)$match[1] . ' months')->format('Y-m-d');
    }
    if (preg_match('/(\d+)\s*(year|years)/', $duration, $match)) {
        return $issued->modify('-' . (int)$match[1] . ' years')->format('Y-m-d');
    }
    if (preg_match('/(\d+)\s*(day|days)/', $duration, $match)) {
        return $issued->modify('-' . (int)$match[1] . ' days')->format('Y-m-d');
    }

    return null;
}
function sanitize_pdf_text(string $text): string
{
    $text = preg_replace('/[^\x20-\x7E]/', '?', $text);
    $text = str_replace(['\\', '(', ')'], ['\\\\', '\\(', '\\)'], $text);
    return $text;
}

function resolve_upload_path(?string $url, array $config): ?string
{
    if (!$url) {
        return null;
    }
    $path = trim((string)$url);
    if ($path === '') {
        return null;
    }
    if (preg_match('/^https?:\\/\\//i', $path)) {
        $parsed = parse_url($path);
        if (!empty($parsed['path'])) {
            $path = $parsed['path'];
        }
    }
    $parsed = parse_url($path);
    if (!empty($parsed['path'])) {
        $path = $parsed['path'];
    }
    if (is_file($path)) {
        return $path;
    }
    $baseDir = $config['uploads']['base_dir'] ?? null;
    if (!$baseDir) {
        return null;
    }
    $baseUrl = $config['uploads']['base_url'] ?? '/uploads';
    if (str_starts_with($path, $baseUrl)) {
        $relative = ltrim(substr($path, strlen($baseUrl)), '/\\');
        $candidate = rtrim($baseDir, '/\\') . DIRECTORY_SEPARATOR . str_replace(['/', '\\'], DIRECTORY_SEPARATOR, $relative);
        if (is_file($candidate)) {
            return $candidate;
        }
    }
    $relative = ltrim($path, '/\\');
    $candidate = rtrim($baseDir, '/\\') . DIRECTORY_SEPARATOR . str_replace(['/', '\\'], DIRECTORY_SEPARATOR, $relative);
    if (is_file($candidate)) {
        return $candidate;
    }
    return null;
}

function hex_to_rgb(string $hex): array
{
    $hex = ltrim(trim($hex), '#');
    if (strlen($hex) === 3) {
        $hex = $hex[0] . $hex[0] . $hex[1] . $hex[1] . $hex[2] . $hex[2];
    }
    if (strlen($hex) !== 6) {
        return [0.0, 0.0, 0.0];
    }
    return [
        hexdec(substr($hex, 0, 2)) / 255,
        hexdec(substr($hex, 2, 2)) / 255,
        hexdec(substr($hex, 4, 2)) / 255
    ];
}

function pdf_set_fill_color(array $rgb): string
{
    return sprintf('%.3f %.3f %.3f rg' . "\n", $rgb[0], $rgb[1], $rgb[2]);
}

function pdf_set_stroke_color(array $rgb): string
{
    return sprintf('%.3f %.3f %.3f RG' . "\n", $rgb[0], $rgb[1], $rgb[2]);
}

function estimate_text_width(string $text, int $size): float
{
    return strlen($text) * $size * 0.5;
}

function pdf_text(string $text, float $x, float $y, int $size = 12, string $align = 'left', string $font = 'F1'): string
{
    $width = estimate_text_width($text, $size);
    if ($align === 'center') {
        $x -= $width / 2;
    } elseif ($align === 'right') {
        $x -= $width;
    }
    $text = sanitize_pdf_text($text);
    return "BT /{$font} {$size} Tf {$x} {$y} Td ({$text}) Tj ET\n";
}

function pdf_line(float $x1, float $y1, float $x2, float $y2, float $width = 1): string
{
    return "{$width} w {$x1} {$y1} m {$x2} {$y2} l S\n";
}

function pdf_rect(float $x, float $y, float $w, float $h, float $width = 1): string
{
    return "{$width} w {$x} {$y} {$w} {$h} re S\n";
}

function pdf_circle(float $cx, float $cy, float $r, bool $fill = false, bool $stroke = true, float $width = 1): string
{
    $k = 0.5522847498;
    $c = $r * $k;
    $x0 = $cx + $r;
    $y0 = $cy;
    $x1 = $cx + $r;
    $y1 = $cy + $c;
    $x2 = $cx + $c;
    $y2 = $cy + $r;
    $x3 = $cx;
    $y3 = $cy + $r;
    $x4 = $cx - $c;
    $y4 = $cy + $r;
    $x5 = $cx - $r;
    $y5 = $cy + $c;
    $x6 = $cx - $r;
    $y6 = $cy;
    $x7 = $cx - $r;
    $y7 = $cy - $c;
    $x8 = $cx - $c;
    $y8 = $cy - $r;
    $x9 = $cx;
    $y9 = $cy - $r;
    $x10 = $cx + $c;
    $y10 = $cy - $r;
    $x11 = $cx + $r;
    $y11 = $cy - $c;

    $path = "{$width} w {$x0} {$y0} m "
        . "{$x1} {$y1} {$x2} {$y2} {$x3} {$y3} c "
        . "{$x4} {$y4} {$x5} {$y5} {$x6} {$y6} c "
        . "{$x7} {$y7} {$x8} {$y8} {$x9} {$y9} c "
        . "{$x10} {$y10} {$x11} {$y11} {$x0} {$y0} c ";

    $op = 'S';
    if ($fill && $stroke) {
        $op = 'B';
    } elseif ($fill) {
        $op = 'f';
    }
    return $path . "{$op}\n";
}

function pdf_fill_rect(float $x, float $y, float $w, float $h): string
{
    return "{$x} {$y} {$w} {$h} re f\n";
}

function pdf_fill_polygon(array $points): string
{
    if (count($points) < 6 || count($points) % 2 !== 0) {
        return '';
    }
    $cmd = "{$points[0]} {$points[1]} m ";
    for ($i = 2; $i < count($points); $i += 2) {
        $cmd .= "{$points[$i]} {$points[$i + 1]} l ";
    }
    return $cmd . "h f\n";
}

function pdf_image(string $name, float $x, float $y, float $w, float $h): string
{
    return "q {$w} 0 0 {$h} {$x} {$y} cm /{$name} Do Q\n";
}

function load_pdf_image(string $path): ?array
{
    if (!$path || !is_file($path)) {
        return null;
    }
    $info = @getimagesize($path);
    if (!$info || empty($info['mime'])) {
        return null;
    }
    $mime = strtolower((string)$info['mime']);
    if ($mime === 'image/jpeg' || $mime === 'image/jpg') {
        return load_pdf_jpeg($path, $info);
    }
    if ($mime === 'image/png') {
        $png = load_pdf_png($path);
        if ($png) {
            return $png;
        }
        return load_pdf_png_as_jpeg($path);
    }
    return null;
}

function load_pdf_jpeg(string $path, array $info): ?array
{
    $data = @file_get_contents($path);
    if ($data === false) {
        return null;
    }
    $channels = $info['channels'] ?? 3;
    $bits = $info['bits'] ?? 8;
    $colorSpace = $channels === 1 ? '/DeviceGray' : ($channels === 4 ? '/DeviceCMYK' : '/DeviceRGB');
    return [
        'data' => $data,
        'width' => $info[0],
        'height' => $info[1],
        'colorSpace' => $colorSpace,
        'bits' => $bits,
        'filter' => '/DCTDecode'
    ];
}

function png_paeth_predictor(int $a, int $b, int $c): int
{
    $p = $a + $b - $c;
    $pa = abs($p - $a);
    $pb = abs($p - $b);
    $pc = abs($p - $c);
    if ($pa <= $pb && $pa <= $pc) {
        return $a;
    }
    if ($pb <= $pc) {
        return $b;
    }
    return $c;
}

function png_unfilter_row(int $filter, string $row, string $prevRow, int $bpp): string
{
    $len = strlen($row);
    if ($len === 0) {
        return '';
    }
    $out = '';
    for ($i = 0; $i < $len; $i++) {
        $x = ord($row[$i]);
        $left = $i >= $bpp ? ord($out[$i - $bpp]) : 0;
        $up = $prevRow !== '' ? ord($prevRow[$i]) : 0;
        $upLeft = $i >= $bpp ? ord($prevRow[$i - $bpp]) : 0;
        switch ($filter) {
            case 0:
                $val = $x;
                break;
            case 1:
                $val = ($x + $left) & 0xFF;
                break;
            case 2:
                $val = ($x + $up) & 0xFF;
                break;
            case 3:
                $val = ($x + intdiv($left + $up, 2)) & 0xFF;
                break;
            case 4:
                $val = ($x + png_paeth_predictor($left, $up, $upLeft)) & 0xFF;
                break;
            default:
                $val = $x;
                break;
        }
        $out .= chr($val);
    }
    return $out;
}

function load_pdf_png(string $path): ?array
{
    $data = @file_get_contents($path);
    if ($data === false) {
        return null;
    }
    if (substr($data, 0, 8) !== "\x89PNG\r\n\x1a\n") {
        return null;
    }
    $offset = 8;
    $length = strlen($data);
    $width = 0;
    $height = 0;
    $bitDepth = 0;
    $colorType = 0;
    $compression = 0;
    $filter = 0;
    $interlace = 0;
    $idat = '';

    while ($offset + 8 <= $length) {
        $chunkLen = unpack('N', substr($data, $offset, 4))[1];
        $offset += 4;
        $chunkType = substr($data, $offset, 4);
        $offset += 4;
        $chunkData = substr($data, $offset, $chunkLen);
        $offset += $chunkLen;
        $offset += 4;
        if ($chunkType === 'IHDR') {
            $fields = unpack('Nwidth/Nheight/CbitDepth/CcolorType/Ccompression/Cfilter/Cinterlace', $chunkData);
            $width = (int)($fields['width'] ?? 0);
            $height = (int)($fields['height'] ?? 0);
            $bitDepth = (int)($fields['bitDepth'] ?? 0);
            $colorType = (int)($fields['colorType'] ?? 0);
            $compression = (int)($fields['compression'] ?? 0);
            $filter = (int)($fields['filter'] ?? 0);
            $interlace = (int)($fields['interlace'] ?? 0);
        } elseif ($chunkType === 'IDAT') {
            $idat .= $chunkData;
        } elseif ($chunkType === 'IEND') {
            break;
        }
    }

    if ($width <= 0 || $height <= 0) {
        return null;
    }
    if ($compression !== 0 || $filter !== 0 || $interlace !== 0) {
        return null;
    }
    if ($bitDepth !== 8) {
        return null;
    }

    $bpp = match ($colorType) {
        0 => 1,
        2 => 3,
        4 => 2,
        6 => 4,
        default => 0
    };
    if ($bpp === 0) {
        return null;
    }

    $raw = @gzuncompress($idat);
    if ($raw === false) {
        $raw = @gzinflate(substr($idat, 2, -4));
    }
    if ($raw === false) {
        return null;
    }

    $rowBytes = $width * $bpp;
    $expected = ($rowBytes + 1) * $height;
    if (strlen($raw) < $expected) {
        return null;
    }

    $pos = 0;
    $prevRow = str_repeat("\0", $rowBytes);
    $rgbData = '';
    $alphaData = null;
    $colorSpace = '/DeviceRGB';
    $colors = 3;
    if ($colorType === 0) {
        $colorSpace = '/DeviceGray';
        $colors = 1;
    } elseif ($colorType === 4) {
        $colorSpace = '/DeviceGray';
        $colors = 1;
        $alphaData = '';
    } elseif ($colorType === 6) {
        $alphaData = '';
    }

    for ($y = 0; $y < $height; $y++) {
        $filterType = ord($raw[$pos]);
        $pos++;
        $row = substr($raw, $pos, $rowBytes);
        $pos += $rowBytes;
        $outRow = png_unfilter_row($filterType, $row, $prevRow, $bpp);
        $prevRow = $outRow;
        if ($colorType === 6) {
            $len = strlen($outRow);
            for ($i = 0; $i < $len; $i += 4) {
                $rgbData .= $outRow[$i] . $outRow[$i + 1] . $outRow[$i + 2];
                $alphaData .= $outRow[$i + 3];
            }
        } elseif ($colorType === 4) {
            $len = strlen($outRow);
            for ($i = 0; $i < $len; $i += 2) {
                $rgbData .= $outRow[$i];
                $alphaData .= $outRow[$i + 1];
            }
        } else {
            $rgbData .= $outRow;
        }
    }

    $compressed = @gzcompress($rgbData);
    if ($compressed === false) {
        return null;
    }
    $decodeParms = '<< /Predictor 1 /Colors ' . $colors . ' /BitsPerComponent ' . $bitDepth . ' /Columns ' . $width . ' >>';
    $image = [
        'data' => $compressed,
        'width' => $width,
        'height' => $height,
        'colorSpace' => $colorSpace,
        'bits' => $bitDepth,
        'filter' => '/FlateDecode',
        'decodeParms' => $decodeParms
    ];
    if ($alphaData !== null) {
        $alphaCompressed = @gzcompress($alphaData);
        if ($alphaCompressed !== false) {
            $image['smask'] = [
                'data' => $alphaCompressed,
                'width' => $width,
                'height' => $height,
                'colorSpace' => '/DeviceGray',
                'bits' => $bitDepth,
                'filter' => '/FlateDecode',
                'decodeParms' => '<< /Predictor 1 /Colors 1 /BitsPerComponent ' . $bitDepth . ' /Columns ' . $width . ' >>'
            ];
        }
    }

    return $image;
}

function load_pdf_png_as_jpeg(string $path): ?array
{
    if (!function_exists('imagecreatefrompng') || !function_exists('imagejpeg')) {
        return null;
    }
    $img = @imagecreatefrompng($path);
    if (!$img) {
        return null;
    }
    $width = imagesx($img);
    $height = imagesy($img);
    $canvas = imagecreatetruecolor($width, $height);
    $white = imagecolorallocate($canvas, 255, 255, 255);
    imagefilledrectangle($canvas, 0, 0, $width, $height, $white);
    imagealphablending($canvas, true);
    imagecopy($canvas, $img, 0, 0, 0, 0, $width, $height);
    imagedestroy($img);
    ob_start();
    imagejpeg($canvas, null, 90);
    $data = ob_get_clean();
    imagedestroy($canvas);
    if ($data === false) {
        return null;
    }
    return [
        'data' => $data,
        'width' => $width,
        'height' => $height,
        'colorSpace' => '/DeviceRGB',
        'bits' => 8,
        'filter' => '/DCTDecode'
    ];
}

function build_pdf(string $content, int $width = 595, int $height = 842, array $images = []): string
{
    $content = "0 0 0 RG\n" . $content;
    $fonts = [
        'F1' => '/Helvetica',
        'F2' => '/Helvetica-Bold',
        'F3' => '/Times-Roman',
        'F4' => '/Times-Bold',
        'F5' => '/Times-Italic'
    ];
    $fontObjects = [];
    $fontRefs = [];
    $objectId = 4;
    foreach ($fonts as $name => $baseFont) {
        $fontObjects[] = [
            'id' => $objectId,
            'base' => $baseFont
        ];
        $fontRefs[] = "/{$name} {$objectId} 0 R";
        $objectId++;
    }
    $contentObjectId = $objectId;
    $objectId++;
    $xObjects = [];
    $imageObjects = [];
    foreach ($images as $name => $image) {
        if (!$image) {
            continue;
        }
        $smaskId = null;
        if (!empty($image['smask'])) {
            $smaskId = $objectId;
            $imageObjects[] = ['id' => $objectId, 'image' => $image['smask'], 'smaskId' => null];
            $objectId++;
        }
        $xObjects[] = "/{$name} {$objectId} 0 R";
        $imageObjects[] = ['id' => $objectId, 'image' => $image, 'smaskId' => $smaskId];
        $objectId++;
    }
    $resourceParts = "/Font << " . implode(' ', $fontRefs) . " >>";
    if ($xObjects) {
        $resourceParts .= " /XObject << " . implode(' ', $xObjects) . " >>";
    }
    $objects = [];
    $objects[] = "1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n";
    $objects[] = "2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n";
    $objects[] = "3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 {$width} {$height}] /Resources << {$resourceParts} >> /Contents {$contentObjectId} 0 R >>\nendobj\n";
    foreach ($fontObjects as $fontObj) {
        $objects[] = $fontObj['id'] . " 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont " . $fontObj['base'] . " >>\nendobj\n";
    }
    $objects[] = $contentObjectId . " 0 obj\n<< /Length " . strlen($content) . " >>\nstream\n" . $content . "endstream\nendobj\n";
    foreach ($imageObjects as $imageObj) {
        $image = $imageObj['image'];
        $stream = $image['data'];
        $decodeParms = '';
        if (!empty($image['decodeParms'])) {
            $decodeParms = " /DecodeParms " . $image['decodeParms'];
        }
        $smask = '';
        if (!empty($imageObj['smaskId'])) {
            $smask = " /SMask " . $imageObj['smaskId'] . " 0 R";
        }
        $objects[] = $imageObj['id'] . " 0 obj\n<< /Type /XObject /Subtype /Image /Width " . $image['width'] . " /Height " . $image['height'] . " /ColorSpace " . $image['colorSpace'] . " /BitsPerComponent " . $image['bits'] . " /Filter " . $image['filter'] . $decodeParms . $smask . " /Length " . strlen($stream) . " >>\nstream\n" . $stream . "\nendstream\nendobj\n";
    }

    $pdf = "%PDF-1.4\n";
    $offsets = [0];
    foreach ($objects as $obj) {
        $offsets[] = strlen($pdf);
        $pdf .= $obj;
    }

    $xrefStart = strlen($pdf);
    $pdf .= "xref\n0 " . count($offsets) . "\n";
    $pdf .= "0000000000 65535 f \n";
    for ($i = 1; $i < count($offsets); $i++) {
        $pdf .= sprintf("%010d 00000 n \n", $offsets[$i]);
    }
    $pdf .= "trailer\n<< /Size " . count($offsets) . " /Root 1 0 R >>\n";
    $pdf .= "startxref\n{$xrefStart}\n%%EOF";

    return $pdf;
}

function build_receipt_pdf(array $fee, float $totalPaid, ?float $totalFee, ?float $dueAmount, array $config = []): string
{
    $width = 1000;
    $height = 760;
    $center = $width / 2;
    $content = '';

    $branding = $config['branding'] ?? [];
    $brandName = strtoupper($branding['name'] ?? 'Pragati Institute');
    $tagline = trim((string)($branding['tagline'] ?? 'ISO Certified Institute'));
    $logoPath = $branding['logo_path'] ?? null;
    $blue = [0.031, 0.169, 0.400];
    $gold = [0.784, 0.608, 0.235];
    $paper = [1.000, 0.992, 0.973];
    $black = [0.067, 0.067, 0.067];
    $muted = [0.250, 0.250, 0.250];

    $receiptNo = $fee['receipt_no'] ?: 'NA';
    $paidOn = format_certificate_date($fee['paid_on'] ?? null) ?? 'NA';
    $studentName = $fee['student_name'] ?? 'NA';
    $enrollment = $fee['enrollment_no'] ?? 'NA';
    $fatherName = $fee['father_name'] ?? 'NA';
    $courseTitle = $fee['course_title'] ?? 'NA';
    $phone = $fee['phone'] ?? 'NA';
    $mode = $fee['mode'] ?? 'NA';
    $receivedAmount = (float)$fee['amount'];
    $balance = $dueAmount;
    $totalFeeLabel = format_receipt_amount($totalFee);
    $paidAmountLabel = format_receipt_amount($totalPaid);
    $balanceLabel = format_receipt_amount($balance);
    $receivedLabel = format_receipt_amount($receivedAmount);
    $amountWords = receipt_amount_words($receivedAmount);

    $field = function (string $label, string $value, float $x, float $y, float $labelW = 118, float $lineW = 230) use (&$content, $blue, $black): void {
        $content .= pdf_set_fill_color($blue);
        $content .= pdf_text($label, $x, $y, 10, 'left', 'F4');
        $content .= pdf_set_stroke_color($black);
        $content .= pdf_line($x + $labelW, $y - 3, $x + $labelW + $lineW, $y - 3, 1.1);
        $content .= pdf_set_fill_color($black);
        $size = strlen($value) > 30 ? 8 : 9;
        $content .= pdf_text($value, $x + $labelW + 8, $y, $size, 'left', 'F3');
    };
    $sectionTitle = function (string $text, float $x, float $y, float $w) use (&$content, $blue): void {
        $content .= pdf_set_fill_color($blue);
        $content .= pdf_fill_rect($x, $y, $w, 24);
        $content .= pdf_set_fill_color([1, 1, 1]);
        $content .= pdf_text($text, $x + ($w / 2), $y + 7, 12, 'center', 'F4');
    };

    $content .= pdf_set_fill_color([0.875, 0.902, 0.933]);
    $content .= pdf_fill_rect(0, 0, $width, $height);
    $content .= pdf_set_fill_color([1, 1, 1]);
    $content .= pdf_fill_rect(8, 8, 984, 744);
    $content .= pdf_set_stroke_color($blue);
    $content .= pdf_rect(8, 8, 984, 744, 12);
    $content .= pdf_set_fill_color([1, 1, 1]);
    $content .= pdf_fill_rect(28, 28, 944, 704);
    $content .= pdf_set_stroke_color($gold);
    $content .= pdf_rect(28, 28, 944, 704, 4);

    $images = [];
    $logo = $logoPath ? load_pdf_image($logoPath) : null;
    $logoCx = 105;
    $logoCy = 650;
    if ($logo) {
        $logoName = 'Im1';
        $images[$logoName] = $logo;
        $scale = min(88 / $logo['width'], 88 / $logo['height']);
        $logoW = $logo['width'] * $scale;
        $logoH = $logo['height'] * $scale;
        $content .= pdf_image($logoName, $logoCx - ($logoW / 2), $logoCy - ($logoH / 2), $logoW, $logoH);
    } else {
        $content .= pdf_set_fill_color($blue);
        $content .= pdf_text('PI', $logoCx, $logoCy - 6, 26, 'center', 'F4');
    }

    $content .= pdf_set_fill_color($blue);
    $content .= pdf_text($brandName, $center, 678, 36, 'center', 'F4');
    $content .= pdf_set_fill_color($gold);
    $content .= pdf_text('* ' . $tagline . ' *', $center, 646, 16, 'center', 'F5');
    $content .= pdf_set_fill_color($black);
    $content .= pdf_text('AN ISO 9001:2015 CERTIFIED ORGANIZATION', $center, 625, 12, 'center', 'F2');

    $boxX = 805;
    $boxY = 616;
    $content .= pdf_set_fill_color($paper);
    $content .= pdf_fill_rect($boxX, $boxY, 132, 82);
    $content .= pdf_set_stroke_color($gold);
    $content .= pdf_rect($boxX, $boxY, 132, 82, 2);
    $content .= pdf_set_fill_color($blue);
    $content .= pdf_text('Receipt No.:', $boxX + 12, $boxY + 55, 12, 'left', 'F4');
    $content .= pdf_text('Date:', $boxX + 12, $boxY + 24, 12, 'left', 'F4');
    $content .= pdf_set_fill_color($black);
    $content .= pdf_text($receiptNo, $boxX + 12, $boxY + 40, 12, 'left', 'F3');
    $content .= pdf_text($paidOn, $boxX + 12, $boxY + 9, 12, 'left', 'F3');

    $content .= pdf_set_fill_color($blue);
    $content .= pdf_fill_rect(290, 560, 420, 36);
    $content .= pdf_set_fill_color([1, 1, 1]);
    $content .= pdf_text('FEE RECEIPT', $center, 571, 24, 'center', 'F4');

    $detailsX = 58;
    $detailsY = 424;
    $detailsW = 884;
    $detailsH = 122;
    $content .= pdf_set_fill_color($paper);
    $content .= pdf_fill_rect($detailsX, $detailsY, $detailsW, $detailsH);
    $content .= pdf_set_stroke_color($gold);
    $content .= pdf_rect($detailsX, $detailsY, $detailsW, $detailsH, 2);
    $sectionTitle('STUDENT DETAILS', $detailsX + 16, $detailsY + $detailsH - 34, 170);
    $field('Student Name:', $studentName, $detailsX + 28, $detailsY + 54, 125, 285);
    $field('Enrollment No.:', $enrollment, $detailsX + 475, $detailsY + 54, 130, 245);
    $field("Father's Name:", $fatherName, $detailsX + 28, $detailsY + 30, 125, 285);
    $field('Mobile No.:', $phone, $detailsX + 475, $detailsY + 30, 130, 245);
    $field('Course Name:', $courseTitle, $detailsX + 28, $detailsY + 6, 125, 285);
    $field('Batch Timing:', 'NA', $detailsX + 475, $detailsY + 6, 130, 245);

    $tableX = 58;
    $tableY = 294;
    $tableW = 884;
    $headerH = 30;
    $rowH = 27;
    $cols = [70, 410, 210, 194];
    $content .= pdf_set_stroke_color($gold);
    $content .= pdf_rect($tableX, $tableY, $tableW, $headerH + (3 * $rowH), 1.5);
    $content .= pdf_set_fill_color($blue);
    $content .= pdf_fill_rect($tableX, $tableY + (3 * $rowH), $tableW, $headerH);
    $x = $tableX;
    foreach ($cols as $colW) {
        $content .= pdf_set_stroke_color($gold);
        $content .= pdf_line($x, $tableY, $x, $tableY + $headerH + (3 * $rowH), 1);
        $x += $colW;
    }
    $content .= pdf_line($tableX + $tableW, $tableY, $tableX + $tableW, $tableY + $headerH + (3 * $rowH), 1);
    for ($i = 0; $i <= 3; $i++) {
        $content .= pdf_line($tableX, $tableY + ($i * $rowH), $tableX + $tableW, $tableY + ($i * $rowH), 1);
    }
    $content .= pdf_set_fill_color([1, 1, 1]);
    $content .= pdf_text('S.No.', $tableX + 35, $tableY + 91, 12, 'center', 'F4');
    $content .= pdf_text('Particulars', $tableX + 275, $tableY + 91, 12, 'center', 'F4');
    $content .= pdf_text('Month / Installment', $tableX + 585, $tableY + 91, 12, 'center', 'F4');
    $content .= pdf_text('Amount', $tableX + 787, $tableY + 91, 12, 'center', 'F4');
    $rows = [
        ['1', 'Course Fee', '', $receivedLabel],
        ['2', 'Registration / Admission Fee', '', 'Rs. 0.00'],
        ['3', 'Other Charges', '', 'Rs. 0.00']
    ];
    foreach ($rows as $idx => $row) {
        $y = $tableY + 58 - ($idx * $rowH);
        $content .= pdf_set_fill_color($black);
        $content .= pdf_text($row[0], $tableX + 35, $y, 12, 'center', 'F3');
        $content .= pdf_text($row[1], $tableX + 88, $y, 12, 'left', 'F3');
        $content .= pdf_text($row[2], $tableX + 585, $y, 12, 'center', 'F3');
        $content .= pdf_text($row[3], $tableX + 858, $y, 12, 'right', 'F4');
    }

    $wordsX = 58;
    $wordsY = 194;
    $wordsW = 545;
    $wordsH = 74;
    $content .= pdf_set_fill_color($paper);
    $content .= pdf_fill_rect($wordsX, $wordsY, $wordsW, $wordsH);
    $content .= pdf_set_stroke_color($gold);
    $content .= pdf_rect($wordsX, $wordsY, $wordsW, $wordsH, 2);
    $content .= pdf_set_fill_color($blue);
    $content .= pdf_text('Amount in Words:', $wordsX + 18, $wordsY + 50, 14, 'left', 'F4');
    $content .= pdf_set_fill_color($black);
    $content .= pdf_text($amountWords, $wordsX + 18, $wordsY + 28, strlen($amountWords) > 58 ? 10 : 12, 'left', 'F3');
    $content .= pdf_set_stroke_color($black);
    $content .= pdf_line($wordsX + 18, $wordsY + 20, $wordsX + $wordsW - 18, $wordsY + 20, 1);
    $content .= pdf_line($wordsX + 18, $wordsY + 43, $wordsX + $wordsW - 18, $wordsY + 43, 1);

    $summaryX = 625;
    $summaryY = 184;
    $summaryW = 317;
    $summaryRowH = 26;
    $summaryRows = [
        ['Total Fee', $totalFeeLabel, false],
        ['Paid Amount', $paidAmountLabel, false],
        ['Balance', $balanceLabel, false],
        ['Received', $receivedLabel, true]
    ];
    $content .= pdf_set_stroke_color($gold);
    $content .= pdf_rect($summaryX, $summaryY, $summaryW, $summaryRowH * 4, 2);
    foreach ($summaryRows as $idx => $row) {
        $y = $summaryY + (($summaryRows ? 3 - $idx : 0) * $summaryRowH);
        if ($row[2]) {
            $content .= pdf_set_fill_color($blue);
            $content .= pdf_fill_rect($summaryX, $y, $summaryW, $summaryRowH);
            $content .= pdf_set_fill_color([1, 1, 1]);
        } else {
            $content .= pdf_set_fill_color($black);
        }
        $content .= pdf_text($row[0], $summaryX + 16, $y + 8, 12, 'left', $row[2] ? 'F4' : 'F3');
        $content .= pdf_text($row[1], $summaryX + $summaryW - 16, $y + 8, 12, 'right', $row[2] ? 'F4' : 'F3');
        $content .= pdf_set_stroke_color($gold);
        $content .= pdf_line($summaryX, $y, $summaryX + $summaryW, $y, 1);
    }

    $paymentX = 58;
    $paymentY = 118;
    $paymentW = 884;
    $paymentH = 58;
    $content .= pdf_set_fill_color($paper);
    $content .= pdf_fill_rect($paymentX, $paymentY, $paymentW, $paymentH);
    $content .= pdf_set_stroke_color($gold);
    $content .= pdf_rect($paymentX, $paymentY, $paymentW, $paymentH, 2);
    $sectionTitle('PAYMENT DETAILS', $paymentX + 16, $paymentY + 26, 172);
    $field('Payment Mode:', $mode, $paymentX + 220, $paymentY + 34, 118, 190);
    $field('Transaction ID:', 'NA', $paymentX + 580, $paymentY + 34, 118, 180);
    $field('Received By:', 'PRAGATI INSTITUTE', $paymentX + 220, $paymentY + 10, 118, 190);
    $field('Next Due Date:', 'NA', $paymentX + 580, $paymentY + 10, 118, 180);

    $content .= pdf_set_fill_color($paper);
    $content .= pdf_fill_rect(58, 84, 884, 22);
    $content .= pdf_set_stroke_color($gold);
    $content .= pdf_rect(58, 84, 884, 22, 1.5);
    $content .= pdf_set_fill_color($muted);
    $content .= pdf_text('Note: Fees once paid will not be refunded. This receipt is valid only after authorized signature and institute stamp.', $center, 91, 10, 'center', 'F3');

    $content .= pdf_set_stroke_color($black);
    $content .= pdf_line(80, 60, 300, 60, 1);
    $content .= pdf_line(700, 60, 920, 60, 1);
    $content .= pdf_set_fill_color($black);
    $content .= pdf_text('Student / Guardian Signature', 190, 44, 12, 'center', 'F4');
    $content .= pdf_text('Authorized Signatory - PRAGATI INSTITUTE', 810, 44, 12, 'center', 'F4');
    $content .= pdf_set_fill_color($blue);
    $content .= pdf_fill_rect(58, 14, 884, 20);
    $content .= pdf_set_fill_color([1, 1, 1]);
    $content .= pdf_text('ADD: 22A, STATION ROAD, HUSSAINGANJ, LUCKNOW, UTTAR PRADESH - 226001  |  CONTACT: 7068907681', $center, 20, 10, 'center', 'F4');

    return build_pdf($content, $width, $height, $images);
}

function build_certificate_pdf(array $cert, array $config = []): string
{
    $width = 842;
    $height = 595;
    $center = $width / 2;
    $content = '';

    $branding = $config['branding'] ?? [];
    $brandName = $branding['name'] ?? 'Pragati Institute';
    $addressLine = trim((string)($branding['address'] ?? ($branding['tagline'] ?? '')));
    $subtitle = trim((string)($branding['certificate_subtitle'] ?? 'of participation'));
    $primary = hex_to_rgb($branding['primary'] ?? '#1b87b3');
    $secondary = hex_to_rgb($branding['secondary'] ?? '#0f5b78');
    $accent = hex_to_rgb($branding['accent'] ?? '#48b2e0');
    $logoPath = $branding['logo_path'] ?? null;
    $bgPath = $branding['certificate_bg_path'] ?? null;
    $bgOnly = !empty($branding['certificate_bg_only']);
    $images = [];
    $imageIndex = 1;
    $logoImage = $logoPath ? load_pdf_image($logoPath) : null;
    $bgImage = $bgPath ? load_pdf_image($bgPath) : null;
    if (!$bgImage && $bgPath) {
        $altPath = preg_replace('/\.(png|jpeg|jpg)$/i', '.jpg', $bgPath);
        if ($altPath && $altPath !== $bgPath && is_file($altPath)) {
            $bgImage = load_pdf_image($altPath);
        }
    }
    $photoPath = resolve_upload_path($cert['photo_url'] ?? null, $config);
    $photoImage = $photoPath ? load_pdf_image($photoPath) : null;

    $studentName = trim($cert['student_name'] ?? 'Student');
    $courseTitle = trim($cert['course_title'] ?? 'Course');
    $duration = $cert['course_duration'] ?? 'NA';
    $enrollment = $cert['enrollment_no'] ?? 'NA';
    $issuedOn = $cert['issued_on'] ?? ($cert['created_at'] ?? date('Y-m-d'));
    if ($issuedOn) {
        $issuedOn = substr((string)$issuedOn, 0, 10);
    }
    $grade = trim((string)($cert['grade'] ?? 'NA'));
    $percentage = $cert['percentage'] ?? null;
    $certCode = $cert['certificate_code'] ?? 'NA';

    $nameSize = 24;
    if (strlen($studentName) > 26) {
        $nameSize = 21;
    }
    if (strlen($studentName) > 38) {
        $nameSize = 19;
    }

    $bodySize = 10;
    $eventLine = $courseTitle ?: 'Program Title';
    if (strlen($eventLine) > 60) {
        $bodySize = 9;
    }

    $borderOuter = $primary;
    $borderInner = [
        1 - (1 - $primary[0]) * 0.55,
        1 - (1 - $primary[1]) * 0.55,
        1 - (1 - $primary[2]) * 0.55
    ];

    $content .= pdf_set_fill_color([1, 1, 1]);
    $content .= pdf_fill_rect(0, 0, $width, $height);

    if ($bgImage) {
        $bgName = 'Im' . $imageIndex++;
        $images[$bgName] = $bgImage;
        $scale = min($width / $bgImage['width'], $height / $bgImage['height']);
        $bgW = $bgImage['width'] * $scale;
        $bgH = $bgImage['height'] * $scale;
        $bgX = ($width - $bgW) / 2;
        $bgY = ($height - $bgH) / 2;
        $content .= pdf_image($bgName, $bgX, $bgY, $bgW, $bgH);
    }
    if ($bgOnly) {
        return build_pdf($content, $width, $height, $images);
    }

    $hasBg = $bgImage !== null;
    if (!$hasBg) {
        $content .= pdf_set_stroke_color($borderOuter);
        $content .= pdf_rect(16, 16, $width - 32, $height - 32, 3);
        $content .= pdf_set_stroke_color($borderInner);
        $content .= pdf_rect(26, 26, $width - 52, $height - 52, 1.2);

        $content .= pdf_set_stroke_color($borderOuter);
        $cornerSize = 28;
        $content .= pdf_line(40, $height - 42, 40 + $cornerSize, $height - 42, 1);
        $content .= pdf_line(40, $height - 42, 40, $height - 42 - $cornerSize, 1);
        $content .= pdf_circle(56, $height - 58, 6, false, true, 1);
        $content .= pdf_line($width - 40 - $cornerSize, $height - 42, $width - 40, $height - 42, 1);
        $content .= pdf_line($width - 40, $height - 42, $width - 40, $height - 42 - $cornerSize, 1);
        $content .= pdf_circle($width - 56, $height - 58, 6, false, true, 1);
        $content .= pdf_line(40, 42, 40 + $cornerSize, 42, 1);
        $content .= pdf_line(40, 42, 40, 42 + $cornerSize, 1);
        $content .= pdf_circle(56, 58, 6, false, true, 1);
        $content .= pdf_line($width - 40 - $cornerSize, 42, $width - 40, 42, 1);
        $content .= pdf_line($width - 40, 42, $width - 40, 42 + $cornerSize, 1);
        $content .= pdf_circle($width - 56, 58, 6, false, true, 1);
    }

    $topInset = 60;
    $logoRight = 52;
    if ($logoImage && !$hasBg) {
        $logoMaxW = 66;
        $logoMaxH = 66;
        $scale = min($logoMaxW / $logoImage['width'], $logoMaxH / $logoImage['height']);
        $logoW = $logoImage['width'] * $scale;
        $logoH = $logoImage['height'] * $scale;
        $logoX = 52;
        $logoY = $height - $topInset - $logoH;
        $logoName = 'Im' . $imageIndex++;
        $images[$logoName] = $logoImage;
        $content .= pdf_image($logoName, $logoX, $logoY, $logoW, $logoH);
        $logoRight = $logoX + $logoW;
    }

    if ($hasBg) {
        $photoFrameW = 92;
        $photoFrameH = 112;
        $photoInsetX = 74;
        $photoInsetY = 78;
        $photoFrameX = $width - $photoInsetX - $photoFrameW;
        $photoFrameY = $height - $photoInsetY - $photoFrameH;
        $content .= pdf_set_stroke_color($secondary);
        $content .= pdf_rect($photoFrameX, $photoFrameY, $photoFrameW, $photoFrameH, 0.8);
        if ($photoImage) {
            $innerW = $photoFrameW - 6;
            $innerH = $photoFrameH - 6;
            $scale = min($innerW / $photoImage['width'], $innerH / $photoImage['height']);
            $photoW = $photoImage['width'] * $scale;
            $photoH = $photoImage['height'] * $scale;
            $photoX = $photoFrameX + ($photoFrameW - $photoW) / 2;
            $photoY = $photoFrameY + ($photoFrameH - $photoH) / 2;
            $photoName = 'Im' . $imageIndex++;
            $images[$photoName] = $photoImage;
            $content .= pdf_image($photoName, $photoX, $photoY, $photoW, $photoH);
        } else {
            $content .= pdf_set_fill_color([0.55, 0.55, 0.55]);
            $content .= pdf_text('Photo', $photoFrameX + $photoFrameW / 2, $photoFrameY + ($photoFrameH / 2) - 4, 9, 'center');
        }
    } else {
        $photoFrameW = 100;
        $photoFrameH = 120;
        $photoFrameX = $width - 64 - $photoFrameW;
        $photoFrameY = $height - $topInset - $photoFrameH - 8;
        $content .= pdf_set_stroke_color($secondary);
        $content .= pdf_rect($photoFrameX, $photoFrameY, $photoFrameW, $photoFrameH, 0.8);
        if ($photoImage) {
            $innerW = $photoFrameW - 6;
            $innerH = $photoFrameH - 6;
            $scale = min($innerW / $photoImage['width'], $innerH / $photoImage['height']);
            $photoW = $photoImage['width'] * $scale;
            $photoH = $photoImage['height'] * $scale;
            $photoX = $photoFrameX + ($photoFrameW - $photoW) / 2;
            $photoY = $photoFrameY + ($photoFrameH - $photoH) / 2;
            $photoName = 'Im' . $imageIndex++;
            $images[$photoName] = $photoImage;
            $content .= pdf_image($photoName, $photoX, $photoY, $photoW, $photoH);
        } else {
            $content .= pdf_set_fill_color([0.55, 0.55, 0.55]);
            $content .= pdf_text('Photo', $photoFrameX + $photoFrameW / 2, $photoFrameY + ($photoFrameH / 2) - 4, 9, 'center');
        }
    }

    $nameMaxWidth = $width * 0.6;
    if (!$hasBg) {
        $nameMaxWidth = $photoFrameX - $logoRight - 24;
        if ($nameMaxWidth < 200) {
            $nameMaxWidth = $width * 0.6;
        }
    }
    $nameSize = 18;
    $maxNameSize = 28;
    while ($nameSize < $maxNameSize && estimate_text_width($brandName, $nameSize + 1) <= $nameMaxWidth) {
        $nameSize++;
    }

    if ($hasBg) {
        $baseY = 406;
        $titleColor = [0.36, 0.43, 0.55];
        $isoColor = [0.46, 0.53, 0.65];
        $bodyColor = [0.26, 0.32, 0.4];
        $content .= pdf_set_fill_color($isoColor);
        $content .= pdf_text('AN ISO 9001:2015 CERTIFIED ORGANIZATION', $center, $baseY, 9, 'center', 'F3');
        $content .= pdf_text('CERTIFICATE', $center - 15, $baseY - 34, 30, 'center', 'F4');
        $content .= pdf_text('OF TRAINING', $center, $baseY - 50, 12, 'center', 'F3');
        $content .= pdf_set_stroke_color($titleColor);
        $content .= pdf_line($center - 210, $baseY - 56, $center + 210, $baseY - 56, 0.7);

        $studentSize = 24;  
        if (strlen($studentName) > 26) {
            $studentSize = 22;
        }
        if (strlen($studentName) > 38) {
            $studentSize = 20;
        }

        $lineGap = 22;
        $line1 = $baseY - 106;
        $line2 = $line1 - $lineGap;
        $line3 = $line2 - $lineGap;
        $line4 = $line3 - $lineGap;
        $line5 = $line4 - $lineGap;
        $line6 = $line5 - $lineGap;
        $line7 = $line6 - $lineGap;
        $line8 = $line7 - $lineGap;
        $signLineY = $line8 - 24;
        $signTextY = $signLineY + 14;
        $addressY = max(64, $signLineY - 26);

        $studentLabel = 'Mr./Ms. ' . $studentName;
        $prefixText = 'This is to certify that';
        $prefixSize = 12;
        $prefixWidth = estimate_text_width($prefixText, $prefixSize);
        $nameWidth = estimate_text_width($studentLabel, $studentSize);
        $inlineGap = 1;
        $totalWidth = $prefixWidth + $inlineGap + $nameWidth;
        $startX = $center - ($totalWidth / 2);
        $nameX = $startX + $prefixWidth + $inlineGap;

        $content .= pdf_set_fill_color($bodyColor);
        $content .= pdf_text($prefixText, $startX, $line1, $prefixSize, 'left', 'F3');
        $content .= pdf_set_fill_color($titleColor);
        $content .= pdf_text($studentLabel, $nameX, $line1, $studentSize, 'left', 'F4');
        $content .= pdf_set_stroke_color($titleColor);
        $content .= pdf_line($nameX, $line1 - 6, $nameX + $nameWidth, $line1 - 6, 0.8);
        $midShift = 10;
        $content .= pdf_set_fill_color($bodyColor);
        $content .= pdf_text('has successfully completed the', $center + $midShift, $line2, 12, 'center', 'F3');
        $content .= pdf_set_fill_color($titleColor);
        $courseText = trim((string)($eventLine ?: '____________________'));
        $courseSize = 16;
        if (strlen($courseText) > 26) {
            $courseSize = 14;
        }
        if (strlen($courseText) > 38) {
            $courseSize = 12;
        }
        $courseOffset = max(0, ($courseSize - 12) * 0.45);
        $courseX = $center - 12 + $midShift;
        $content .= pdf_text($courseText, $courseX, $line3 + $courseOffset, $courseSize, 'center', 'F4');
        $content .= pdf_set_fill_color($bodyColor);
        $content .= pdf_text('at Pragati Institute, Lucknow.', $center + $midShift, $line4, 12, 'center', 'F3');
        $durationText = $duration !== '' && $duration !== null ? (string)$duration : '__________';
        $content .= pdf_text('Course Duration: ' . $durationText, $center + $midShift, $line5, 12, 'center', 'F3');
        $content .= pdf_set_stroke_color($bodyColor);
        $fromDate = format_certificate_date(certificate_from_date_source($cert)) ?? '____/____/____';
        $toDate = format_certificate_date($cert['to_date'] ?? ($cert['issued_on'] ?? null)) ?? '____/____/____';
        $lineLen = 120;
        $lineGap = 36;
        $fromToShift = 30;
        $fromLineEnd = $center - ($lineGap / 2) + $fromToShift;
        $fromLineStart = $fromLineEnd - $lineLen;
        $toLineStart = $center + ($lineGap / 2) + $fromToShift;
        $toLineEnd = $toLineStart + $lineLen;
        $fromLabelX = $fromLineStart - 32;
        $toLabelX = $toLineStart - 18;
        $content .= pdf_text('From:', $fromLabelX, $line6, 11, 'left', 'F3');
        $content .= pdf_line($fromLineStart, $line6 - 2, $fromLineEnd, $line6 - 2, 0.7);
        $content .= pdf_text($fromDate, ($fromLineStart + $fromLineEnd) / 2, $line6, 10, 'center', 'F3');
        $content .= pdf_text('To:', $toLabelX, $line6, 11, 'left', 'F3');
        $content .= pdf_line($toLineStart, $line6 - 2, $toLineEnd, $line6 - 2, 0.7);
        $content .= pdf_text($toDate, ($toLineStart + $toLineEnd) / 2, $line6, 10, 'center', 'F3');

        $wishX = $center + 30;
        $content .= pdf_text('We wish him/her every success in his/her future career.', $wishX, $line7, 11, 'center', 'F3');

        $issuedLabel = $issuedOn ? strtoupper($issuedOn) : '____/____/____';
        $content .= pdf_set_fill_color($bodyColor);
        $dateLineStart = 90;
        $dateLineEnd = 230;
        $authLineEnd = $width - 90;
        $authLineStart = $authLineEnd - 140;
        $content .= pdf_set_stroke_color($bodyColor);
        $content .= pdf_line($dateLineStart, $signLineY, $dateLineEnd, $signLineY, 0.7);
        $content .= pdf_line($authLineStart, $signLineY, $authLineEnd, $signLineY, 0.7);
        $content .= pdf_text('DATE OF ISSUE: ' . $issuedLabel, ($dateLineStart + $dateLineEnd) / 2, $signTextY, 8, 'center', 'F4');
        $authCenter = ($authLineStart + $authLineEnd) / 2 - 5;
        $content .= pdf_text('AUTHORIZED SIGNATORY', $authCenter, $signTextY, 9, 'center', 'F4');
        $content .= pdf_text('PRAGATI INSTITUTE', $authCenter, $signLineY - 14, 8, 'center', 'F3');

        $addressBottom = $branding['address'] ?? 'ADD:-22A, STATION ROAD, HUSSAINGANJ, LUCKNOW';
        $content .= pdf_text($addressBottom, $center, $addressY, 8.5, 'center', 'F4');

        return build_pdf($content, $width, $height, $images);
    }

    $content .= pdf_set_fill_color($secondary);
    $content .= pdf_text($brandName, $center, 506, $nameSize, 'center', 'F4');
    if ($addressLine !== '') {
        $content .= pdf_set_fill_color([0.35, 0.35, 0.35]);
        $content .= pdf_text($addressLine, $center, 486, 9, 'center', 'F1');
    }

    $yShift = $hasBg ? -48 : 0;
    $certY = 430 + $yShift;
    $certifyY = 404 + $yShift;
    $studentY = 372 + $yShift;
    $actionY = 346 + $yShift;
    $detailY = 326 + $yShift;

    if (!$hasBg) {
        $content .= pdf_set_fill_color([0.15, 0.15, 0.15]);
        $content .= pdf_text('CERTIFICATE', $center, $certY, 30, 'center', 'F2');
    }
    $content .= pdf_set_fill_color($secondary);
    $content .= pdf_text('This is to certify that', $center, $certifyY, 11, 'center', 'F5');

    $content .= pdf_set_fill_color($primary);
    $content .= pdf_text($studentName, $center, $studentY, 24, 'center', 'F5');

    $content .= pdf_set_fill_color([0.25, 0.25, 0.25]);
    $content .= pdf_text('has successfully completed', $center, $actionY, $bodySize, 'center', 'F3');

    $courseLine = $eventLine;
    $gradeLine = '';
    if ($percentage !== null && $percentage !== '') {
        $gradeLine = 'Grade: ' . rtrim(rtrim((string)$percentage, '0'), '.') . '%';
    } elseif ($grade !== '' && $grade !== 'NA') {
        $gradeLine = 'Grade: ' . $grade;
    }
    $detailLine = 'Course: ' . $courseLine;
    if ($gradeLine !== '') {
        $detailLine .= '  |  ' . $gradeLine;
    }

    $content .= pdf_text($detailLine, $center, $detailY, $bodySize, 'center', 'F3');

    $content .= pdf_set_stroke_color([0.25, 0.25, 0.25]);
    $sigLineY = $hasBg ? 170 : 180;
    $sigTextY = $hasBg ? 152 : 162;
    $content .= pdf_line(180, $sigLineY, 340, $sigLineY, 0.8);
    $content .= pdf_line($width - 340, $sigLineY, $width - 180, $sigLineY, 0.8);
    $content .= pdf_set_fill_color([0.2, 0.2, 0.2]);
    $content .= pdf_text('Authorized Signatory', 260, $sigTextY, 9, 'center');
    $content .= pdf_text('Director', $width - 260, $sigTextY, 9, 'center');

    $content .= pdf_set_fill_color([0.25, 0.25, 0.25]);
    $content .= pdf_text('Certificate Code: ' . $certCode . '   |   Date of Issue: ' . $issuedOn, $center, 92, 8, 'center');

    return build_pdf($content, $width, $height, $images);
}

function load_certificate_qr_image(string $payload): ?array
{
    if ($payload === '') {
        return null;
    }
    $qrUrl = 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&format=jpg&data=' . rawurlencode($payload);
    $context = stream_context_create([
        'http' => ['timeout' => 4, 'ignore_errors' => true],
        'https' => ['timeout' => 4, 'ignore_errors' => true]
    ]);
    $data = @file_get_contents($qrUrl, false, $context);
    if ($data === false || $data === '') {
        return null;
    }
    $tempPath = tempnam(sys_get_temp_dir(), 'pragati-qr-');
    if (!$tempPath || @file_put_contents($tempPath, $data) === false) {
        return null;
    }
    $image = load_pdf_image($tempPath);
    @unlink($tempPath);
    return $image;
}

function estimate_certificate_text_width(string $text, int $size, string $font = 'F3'): float
{
    $widths = [
        ' ' => 0.25, '.' => 0.25, ',' => 0.25, ':' => 0.28, ';' => 0.28,
        '-' => 0.34, '/' => 0.28, '(' => 0.33, ')' => 0.33, '*' => 0.50,
        'I' => 0.33, 'J' => 0.39, 'M' => 0.89, 'W' => 0.94,
        'A' => 0.72, 'B' => 0.67, 'C' => 0.67, 'D' => 0.72, 'E' => 0.61,
        'F' => 0.56, 'G' => 0.72, 'H' => 0.72, 'K' => 0.72, 'L' => 0.61,
        'N' => 0.72, 'O' => 0.72, 'P' => 0.56, 'Q' => 0.72, 'R' => 0.67,
        'S' => 0.56, 'T' => 0.61, 'U' => 0.72, 'V' => 0.72, 'X' => 0.72,
        'Y' => 0.72, 'Z' => 0.61,
        'f' => 0.33, 'i' => 0.28, 'j' => 0.28, 'l' => 0.28, 'm' => 0.78,
        'r' => 0.33, 't' => 0.28, 'w' => 0.72
    ];
    $boldAdjustment = in_array($font, ['F2', 'F4'], true) ? 0.02 : 0;
    $total = 0.0;
    foreach (str_split($text) as $character) {
        if (isset($widths[$character])) {
            $total += $widths[$character] + $boldAdjustment;
            continue;
        }
        if (ctype_digit($character)) {
            $total += 0.50 + $boldAdjustment;
            continue;
        }
        $total += 0.50 + $boldAdjustment;
    }
    return $total * $size;
}

function certificate_pdf_text(
    string $text,
    float $x,
    float $y,
    int $size = 12,
    string $align = 'left',
    string $font = 'F3'
): string {
    $width = estimate_certificate_text_width($text, $size, $font);
    if ($align === 'center') {
        $x -= $width / 2;
    } elseif ($align === 'right') {
        $x -= $width;
    }
    $text = sanitize_pdf_text($text);
    return "BT /{$font} {$size} Tf {$x} {$y} Td ({$text}) Tj ET\n";
}

function build_certificate_template_pdf(array $cert, array $config = []): string
{
    $width = 842;
    $height = 595;
    $center = $width / 2;
    $navy = hex_to_rgb('#082b66');
    $blue = hex_to_rgb('#0d5bd1');
    $gold = hex_to_rgb('#c89b3c');
    $paper = hex_to_rgb('#fffdf8');
    $black = [0.07, 0.07, 0.07];
    $content = '';
    $images = [];
    $imageIndex = 1;

    $branding = $config['branding'] ?? [];
    $logoPath = $branding['logo_path'] ?? null;
    $logoImage = $logoPath ? load_pdf_image($logoPath) : null;
    $photoPath = resolve_upload_path($cert['photo_url'] ?? null, $config);
    $photoImage = $photoPath ? load_pdf_image($photoPath) : null;

    $studentName = trim((string)($cert['student_name'] ?? 'Student Name'));
    $courseTitle = trim((string)($cert['course_title'] ?? 'Course Name'));
    $duration = trim((string)($cert['course_duration'] ?? 'NA'));
    $enrollment = trim((string)($cert['enrollment_no'] ?? 'NA'));
    $dateOfBirth = format_certificate_date($cert['dob'] ?? null) ?? 'NA';
    $issuedOn = format_certificate_date($cert['issued_on'] ?? ($cert['created_at'] ?? null)) ?? date('d/m/Y');
    $fromDate = format_certificate_date(certificate_from_date_source($cert)) ?? 'NA';
    $toDate = format_certificate_date($cert['to_date'] ?? ($cert['issued_on'] ?? null)) ?? 'NA';
    $certCode = trim((string)($cert['certificate_code'] ?? 'NA'));
    $verificationSite = trim((string)($branding['verification_site'] ?? 'www.pragati-institute.co.in'));
    $qrPayload = trim((string)($cert['qr_url'] ?? ''));
    if ($qrPayload === '') {
        $qrPayload = 'https://' . $verificationSite . '/verify?certificate=' . rawurlencode($certCode);
    }
    $qrImage = load_certificate_qr_image($qrPayload);

    $content .= pdf_set_fill_color([1, 1, 1]);
    $content .= pdf_fill_rect(0, 0, $width, $height);
    $content .= pdf_set_stroke_color($navy);
    $content .= pdf_rect(9, 9, $width - 18, $height - 18, 7);
    $content .= pdf_set_stroke_color($gold);
    $content .= pdf_rect(20, 20, $width - 40, $height - 40, 2);

    if ($logoImage) {
        $logoName = 'Im' . $imageIndex++;
        $images[$logoName] = $logoImage;
        $content .= pdf_image($logoName, 34, 487, 72, 72);
    } else {
        $content .= pdf_set_stroke_color($blue);
        $content .= pdf_circle(70, 523, 34, false, true, 2);
        $content .= pdf_set_fill_color($navy);
        $content .= certificate_pdf_text('PI', 70, 516, 20, 'center', 'F4');
    }

    $content .= pdf_set_fill_color($navy);
    $content .= certificate_pdf_text('PRAGATI INSTITUTE', $center, 536, 34, 'center', 'F4');
    $content .= pdf_set_fill_color($gold);
    $content .= certificate_pdf_text('* ISO Certified Institute *', $center, 513, 12, 'center', 'F5');
    $content .= pdf_set_fill_color($black);
    $content .= certificate_pdf_text('AN ISO 9001:2015 CERTIFIED ORGANIZATION', $center, 499, 8, 'center', 'F2');
    $content .= pdf_set_fill_color($navy);
    $content .= certificate_pdf_text('CERTIFICATE', $center, 467, 34, 'center', 'F4');
    $content .= pdf_set_fill_color($gold);
    $content .= certificate_pdf_text('OF COMPLETION', $center, 447, 14, 'center', 'F2');

    $photoX = 737;
    $photoY = 474;
    $photoW = 70;
    $photoH = 86;
    $content .= pdf_set_stroke_color($gold);
    $content .= pdf_rect($photoX, $photoY, $photoW, $photoH, 1.5);
    if ($photoImage) {
        $photoName = 'Im' . $imageIndex++;
        $images[$photoName] = $photoImage;
        $scale = min(($photoW - 4) / $photoImage['width'], ($photoH - 4) / $photoImage['height']);
        $renderW = $photoImage['width'] * $scale;
        $renderH = $photoImage['height'] * $scale;
        $content .= pdf_image(
            $photoName,
            $photoX + ($photoW - $renderW) / 2,
            $photoY + ($photoH - $renderH) / 2,
            $renderW,
            $renderH
        );
    } else {
        $content .= pdf_set_fill_color([0.5, 0.5, 0.5]);
        $content .= certificate_pdf_text('STUDENT', $photoX + ($photoW / 2), $photoY + 42, 7, 'center', 'F2');
        $content .= certificate_pdf_text('PHOTO', $photoX + ($photoW / 2), $photoY + 30, 7, 'center', 'F2');
    }

    $leftX = 35;
    $boxY = 260;
    $sideW = 132;
    $sideH = 154;
    $content .= pdf_set_stroke_color($gold);
    $content .= pdf_rect($leftX, $boxY, $sideW, $sideH, 1.4);
    $content .= pdf_set_fill_color($navy);
    $content .= pdf_fill_rect($leftX + 8, 378, $sideW - 16, 24);
    $content .= pdf_fill_rect($leftX + 8, 315, $sideW - 16, 24);
    $content .= pdf_set_fill_color([1, 1, 1]);
    $content .= certificate_pdf_text('ENROLLMENT NO.', $leftX + ($sideW / 2), 386, 8, 'center', 'F2');
    $content .= certificate_pdf_text('DATE OF BIRTH', $leftX + ($sideW / 2), 323, 8, 'center', 'F2');
    $content .= pdf_set_fill_color($black);
    $enrollmentSize = strlen($enrollment) > 15 ? 8 : 10;
    $content .= certificate_pdf_text($enrollment, $leftX + ($sideW / 2), 358, $enrollmentSize, 'center', 'F4');
    $content .= pdf_set_stroke_color($black);
    $content .= pdf_line($leftX + 16, 350, $leftX + $sideW - 16, 350, 0.6);
    $content .= pdf_set_fill_color($black);
    $content .= certificate_pdf_text($dateOfBirth, $leftX + ($sideW / 2), 295, 10, 'center', 'F4');
    $content .= pdf_set_stroke_color($black);
    $content .= pdf_line($leftX + 16, 287, $leftX + $sideW - 16, 287, 0.6);

    $rightX = 675;
    $content .= pdf_set_stroke_color($gold);
    $content .= pdf_rect($rightX, $boxY, $sideW, $sideH, 1.4);
    $content .= pdf_set_fill_color($navy);
    $content .= pdf_fill_rect($rightX + 8, 378, $sideW - 16, 24);
    $content .= pdf_set_fill_color([1, 1, 1]);
    $content .= certificate_pdf_text('SCAN TO VERIFY', $rightX + ($sideW / 2), 386, 8, 'center', 'F2');
    if ($qrImage) {
        $qrName = 'Im' . $imageIndex++;
        $images[$qrName] = $qrImage;
        $content .= pdf_image($qrName, $rightX + 31, 291, 70, 70);
    } else {
        $content .= pdf_set_stroke_color($navy);
        $content .= pdf_rect($rightX + 31, 291, 70, 70, 0.8);
        $content .= pdf_set_fill_color($navy);
        $content .= certificate_pdf_text('VERIFY', $rightX + ($sideW / 2), 328, 9, 'center', 'F2');
        $content .= certificate_pdf_text('ONLINE', $rightX + ($sideW / 2), 315, 9, 'center', 'F2');
    }
    $content .= pdf_set_fill_color($navy);
    $certCodeSize = strlen($certCode) > 18 ? 6 : 7;
    $content .= certificate_pdf_text($certCode, $rightX + ($sideW / 2), 277, $certCodeSize, 'center', 'F2');
    $grade = trim((string)($cert['grade'] ?? ''));
    if ($grade !== '') {
        $gradeText = 'Grade: ' . $grade;
        $gradeSize = 10;
        while ($gradeSize > 6 && estimate_certificate_text_width($gradeText, $gradeSize, 'F2') > $sideW - 16) {
            $gradeSize--;
        }
        $content .= certificate_pdf_text($gradeText, $rightX + ($sideW / 2), 265, $gradeSize, 'center', 'F2');
    }

    $content .= pdf_set_fill_color($black);
    $content .= certificate_pdf_text('This is to certify that', $center, 399, 13, 'center', 'F3');
    $nameSize = strlen($studentName) > 32 ? 18 : 22;
    $content .= pdf_set_fill_color($navy);
    $content .= certificate_pdf_text($studentName, $center, 373, $nameSize, 'center', 'F4');
    $content .= pdf_set_stroke_color($black);
    $content .= pdf_line(210, 365, 632, 365, 0.8);
    $content .= pdf_set_fill_color($black);
    $content .= certificate_pdf_text('has successfully completed the training in', $center, 340, 13, 'center', 'F3');
    $courseSize = strlen($courseTitle) > 38 ? 15 : 19;
    $content .= pdf_set_fill_color($navy);
    $content .= certificate_pdf_text($courseTitle, $center, 315, $courseSize, 'center', 'F4');
    $content .= pdf_set_stroke_color($black);
    $content .= pdf_line(210, 306, 632, 306, 0.8);
    $content .= pdf_set_fill_color($black);
    $content .= certificate_pdf_text('at Pragati Institute, Lucknow.', $center, 283, 12, 'center', 'F3');
    $content .= certificate_pdf_text('Course Duration: ' . ($duration !== '' ? $duration : 'NA'), $center, 257, 12, 'center', 'F4');
    $dateLeftCenter = 343;
    $dateRightCenter = 499;
    $content .= certificate_pdf_text('From:', $dateLeftCenter - 60, 232, 11, 'left', 'F3');
    $content .= certificate_pdf_text($fromDate, $dateLeftCenter + 18, 232, 11, 'center', 'F3');
    $content .= certificate_pdf_text('To:', $dateRightCenter - 45, 232, 11, 'left', 'F3');
    $content .= certificate_pdf_text($toDate, $dateRightCenter + 25, 232, 11, 'center', 'F3');
    $content .= pdf_set_fill_color($navy);
    $content .= certificate_pdf_text('We wish him/her every success in future career and professional life.', $center, 205, 10, 'center', 'F5');

    $verifyX = 176;
    $verifyY = 145;
    $verifyW = 490;
    $verifyH = 39;
    $content .= pdf_set_fill_color($paper);
    $content .= pdf_fill_rect($verifyX, $verifyY, $verifyW, $verifyH);
    $content .= pdf_set_stroke_color($gold);
    $content .= pdf_rect($verifyX, $verifyY, $verifyW, $verifyH, 1.1);
    $content .= pdf_set_fill_color($black);
    $content .= certificate_pdf_text('This certificate can be verified online on our website', $center, 168, 9, 'center', 'F3');
    $content .= pdf_set_fill_color($navy);
    $content .= certificate_pdf_text($verificationSite . ' using Enrollment Number and Date of Birth.', $center, 154, 9, 'center', 'F4');

    $content .= pdf_set_stroke_color($black);
    $signatureLineY = 125;
    $content .= pdf_line(62, $signatureLineY, 220, $signatureLineY, 0.8);
    $content .= pdf_line(622, $signatureLineY, 780, $signatureLineY, 0.8);
    $content .= pdf_set_fill_color($black);
    $content .= certificate_pdf_text('DATE OF ISSUE: ' . $issuedOn, 141, 110, 8, 'center', 'F2');
    $content .= certificate_pdf_text('AUTHORIZED SIGNATORY', 701, 110, 9, 'center', 'F2');
    $content .= certificate_pdf_text('PRAGATI INSTITUTE', 701, 98, 8, 'center', 'F3');

    // Two-tier organization footer matching the institute's printed certificate.
    $footerX = 30;
    $footerW = 782;
    $detailsY = 68;
    $detailsH = 24;
    $contactY = 36;
    $contactH = 28;

    // Fine dotted divider below the date/signature row.
    $content .= pdf_set_stroke_color([0.45, 0.45, 0.45]);
    for ($dotX = $footerX; $dotX < ($footerX + $footerW); $dotX += 4) {
        $content .= pdf_line($dotX, 95, min($dotX + 1.5, $footerX + $footerW), 95, 0.55);
    }

    $content .= pdf_set_fill_color($paper);
    $content .= pdf_fill_rect($footerX, $detailsY, $footerW, $detailsH);
    $content .= pdf_set_stroke_color($gold);
    $content .= pdf_rect($footerX, $detailsY, $footerW, $detailsH, 0.8);
    $detailColumns = [
        ['text' => 'Managed by Chitransh Welfare Society', 'center' => 142, 'separator' => 254],
        ['text' => 'Society Reg. No.: R-736', 'center' => 337, 'separator' => 420],
        ['text' => 'NGO Darpan ID: UP/2017/0175536', 'center' => 523, 'separator' => 626],
        ['text' => 'Udyam Reg. No.: UDYAM-UP-50-0067056', 'center' => 718, 'separator' => null],
    ];
    $content .= pdf_set_fill_color($navy);
    foreach ($detailColumns as $column) {
        $content .= certificate_pdf_text($column['text'], $column['center'], 77, 7, 'center', 'F2');
        if ($column['separator'] !== null) {
            $content .= pdf_set_stroke_color($gold);
            $content .= pdf_line($column['separator'], 72, $column['separator'], 88, 1);
        }
    }

    $content .= pdf_set_fill_color($navy);
    $content .= pdf_fill_rect($footerX, $contactY, $footerW, $contactH);
    $content .= pdf_set_fill_color([1, 1, 1]);

    // Location pin.
    $content .= pdf_set_stroke_color([1, 1, 1]);
    $content .= pdf_circle(78, 52, 3.3, false, true, 1.4);
    $content .= pdf_line(75.5, 49.8, 78, 43.2, 1.4);
    $content .= pdf_line(80.5, 49.8, 78, 43.2, 1.4);
    $content .= certificate_pdf_text('ADD: 22A, STATION ROAD, HUSSAINGANJ, LUCKNOW, UTTAR PRADESH - 226001', 352, 46, 8, 'center', 'F2');
    $content .= pdf_set_stroke_color([1, 1, 1]);
    $content .= pdf_line(638, 41, 638, 59, 0.8);

    // Simple phone handset mark.
    $content .= pdf_line(660, 55, 657, 51, 1.8);
    $content .= pdf_line(657, 51, 663, 44, 1.8);
    $content .= pdf_line(663, 44, 668, 47, 1.8);
    $content .= certificate_pdf_text('CONTACT: 7068907681', 732, 46, 8, 'center', 'F2');

    return build_pdf($content, $width, $height, $images);
}

function build_simple_pdf(array $lines): string
{
    $content = '';
    $y = 790;
    foreach ($lines as $line) {
        $text = sanitize_pdf_text($line['text']);
        $size = $line['size'] ?? 12;
        $x = $line['x'] ?? 50;
        $content .= "BT /F1 {$size} Tf {$x} {$y} Td ({$text}) Tj ET\n";
        $y -= $line['gap'] ?? 18;
    }

    return build_pdf($content, 595, 842);
}

function handle_fees(string $method, array $segments, PDO $pdo, array $config): void
{
    require_admin($pdo);
    if ($method === 'GET' && count($segments) === 1) {
        $stmt = $pdo->query('SELECT * FROM fees ORDER BY created_at DESC');
        json_response($stmt->fetchAll());
    }

    if ($method === 'GET' && count($segments) === 3 && $segments[2] === 'receipt') {
        $feeId = (int)$segments[1];
        if ($feeId <= 0) {
            not_found();
        }
        $stmt = $pdo->prepare(
            'SELECT fees.*, students.name AS student_name, students.father_name, students.enrollment_no, students.phone, students.course_id, courses.title AS course_title, courses.fee AS course_fee
             FROM fees
             LEFT JOIN students ON students.id = fees.student_id
             LEFT JOIN courses ON courses.id = students.course_id
             WHERE fees.id = :id
             LIMIT 1'
        );
        $stmt->execute([':id' => $feeId]);
        $fee = $stmt->fetch();
        if (!$fee) {
            not_found();
        }

        $totalStmt = $pdo->prepare('SELECT COALESCE(SUM(amount), 0) AS total FROM fees WHERE student_id = :student_id');
        $totalStmt->execute([':student_id' => $fee['student_id']]);
        $totalPaid = (float)$totalStmt->fetch()['total'];

        $totalFee = null;
        if (isset($fee['total_fee']) && $fee['total_fee'] !== null && $fee['total_fee'] !== '') {
            $totalFee = (float)$fee['total_fee'];
        } elseif ($fee['course_fee'] !== null && $fee['course_fee'] !== '') {
            $totalFee = (float)$fee['course_fee'];
        }
        $dueAmount = $totalFee !== null ? max($totalFee - $totalPaid, 0) : null;

        $receiptNo = $fee['receipt_no'] ?: 'NA';
        $pdf = build_receipt_pdf($fee, $totalPaid, $totalFee, $dueAmount, $config);
        $token = preg_replace('/[^A-Za-z0-9_-]/', '', (string)($fee['receipt_no'] ?? ''));
        if ($token === '') {
            $token = 'fee-' . $feeId;
        }
        header('Content-Type: application/pdf');
        header('Content-Disposition: attachment; filename="receipt-' . $token . '.pdf"');
        header('Content-Length: ' . strlen($pdf));
        echo $pdf;
        exit;
    }

    if ($method === 'POST' && count($segments) === 1) {
        $data = get_json_body();
        validate_fee_payment_amount($pdo, (int)($data['student_id'] ?? 0), (float)($data['amount'] ?? 0));
        $stmt = $pdo->prepare('INSERT INTO fees (student_id, amount, mode, paid_on, receipt_no) VALUES (:student_id, :amount, :mode, :paid_on, :receipt_no)');
        $stmt->execute([
            ':student_id' => $data['student_id'],
            ':amount' => $data['amount'],
            ':mode' => $data['mode'] ?? null,
            ':paid_on' => normalize_date($data['paid_on'] ?? null),
            ':receipt_no' => $data['receipt_no'] ?? null
        ]);
        json_response(['id' => (int)$pdo->lastInsertId()], 201);
    }

    if ($method === 'PUT' && count($segments) === 2) {
        $feeId = (int)$segments[1];
        $data = get_json_body();
        validate_fee_payment_amount($pdo, (int)($data['student_id'] ?? 0), (float)($data['amount'] ?? 0), $feeId);
        $stmt = $pdo->prepare('UPDATE fees SET student_id = :student_id, amount = :amount, mode = :mode, paid_on = :paid_on, receipt_no = :receipt_no WHERE id = :id');
        $stmt->execute([
            ':student_id' => $data['student_id'],
            ':amount' => $data['amount'],
            ':mode' => $data['mode'] ?? null,
            ':paid_on' => normalize_date($data['paid_on'] ?? null),
            ':receipt_no' => $data['receipt_no'] ?? null,
            ':id' => $feeId
        ]);
        json_response(['status' => 'updated']);
    }

    if ($method === 'DELETE' && count($segments) === 2) {
        $feeId = (int)$segments[1];
        $stmt = $pdo->prepare('DELETE FROM fees WHERE id = :id');
        $stmt->execute([':id' => $feeId]);
        json_response(['status' => 'deleted']);
    }

    not_found();
}

function validate_fee_payment_amount(PDO $pdo, int $studentId, float $amount, ?int $excludeFeeId = null): void
{
    if ($studentId <= 0) {
        bad_request('Student is required.');
    }
    if ($amount <= 0) {
        bad_request('Fee amount must be greater than zero.');
    }

    $studentStmt = $pdo->prepare(
        'SELECT students.id, courses.fee AS course_fee
         FROM students
         LEFT JOIN courses ON courses.id = students.course_id
         WHERE students.id = :id
         LIMIT 1'
    );
    $studentStmt->execute([':id' => $studentId]);
    $student = $studentStmt->fetch();
    if (!$student) {
        bad_request('Selected student was not found.');
    }

    $courseFee = $student['course_fee'] ?? null;
    if ($courseFee === null || $courseFee === '') {
        return;
    }

    if ($excludeFeeId) {
        $paidStmt = $pdo->prepare('SELECT COALESCE(SUM(amount), 0) AS total FROM fees WHERE student_id = :student_id AND id <> :fee_id');
        $paidStmt->execute([':student_id' => $studentId, ':fee_id' => $excludeFeeId]);
    } else {
        $paidStmt = $pdo->prepare('SELECT COALESCE(SUM(amount), 0) AS total FROM fees WHERE student_id = :student_id');
        $paidStmt->execute([':student_id' => $studentId]);
    }

    $alreadyPaid = (float)($paidStmt->fetch()['total'] ?? 0);
    $courseFeeValue = (float)$courseFee;
    if (($alreadyPaid + $amount) > ($courseFeeValue + 0.001)) {
        $remaining = max($courseFeeValue - $alreadyPaid, 0);
        bad_request('Payment exceeds course fee. Remaining payable amount is Rs. ' . number_format($remaining, 2, '.', ''));
    }
}

function handle_other_income(string $method, array $segments, PDO $pdo): void
{
    require_admin($pdo);

    if ($method === 'GET' && count($segments) === 1) {
        $stmt = $pdo->query('SELECT * FROM other_incomes ORDER BY created_at DESC');
        json_response($stmt->fetchAll());
    }

    if ($method === 'POST' && count($segments) === 1) {
        $data = get_json_body();
        $source = trim($data['source'] ?? '');
        $amount = $data['amount'] ?? null;
        if (!$source || $amount === null || $amount === '') {
            bad_request('Source and amount are required.');
        }
        $stmt = $pdo->prepare('INSERT INTO other_incomes (source, amount, paid_on, description) VALUES (:source, :amount, :paid_on, :description)');
        $stmt->execute([
            ':source' => $source,
            ':amount' => $amount,
            ':paid_on' => normalize_date($data['paid_on'] ?? null),
            ':description' => $data['description'] ?? null
        ]);
        json_response(['id' => (int)$pdo->lastInsertId()], 201);
    }

    if ($method === 'PUT' && count($segments) === 2) {
        $incomeId = (int)$segments[1];
        $data = get_json_body();
        $source = trim($data['source'] ?? '');
        $amount = $data['amount'] ?? null;
        if (!$source || $amount === null || $amount === '') {
            bad_request('Source and amount are required.');
        }
        $stmt = $pdo->prepare('UPDATE other_incomes SET source = :source, amount = :amount, paid_on = :paid_on, description = :description WHERE id = :id');
        $stmt->execute([
            ':source' => $source,
            ':amount' => $amount,
            ':paid_on' => normalize_date($data['paid_on'] ?? null),
            ':description' => $data['description'] ?? null,
            ':id' => $incomeId
        ]);
        json_response(['status' => 'updated']);
    }

    if ($method === 'DELETE' && count($segments) === 2) {
        $incomeId = (int)$segments[1];
        $stmt = $pdo->prepare('DELETE FROM other_incomes WHERE id = :id');
        $stmt->execute([':id' => $incomeId]);
        json_response(['status' => 'deleted']);
    }

    not_found();
}

function handle_expenses(string $method, array $segments, PDO $pdo): void
{
    require_admin($pdo);
    if ($method === 'GET' && count($segments) === 1) {
        $stmt = $pdo->query('SELECT * FROM expenses ORDER BY created_at DESC');
        json_response($stmt->fetchAll());
    }

    if ($method === 'POST' && count($segments) === 1) {
        $data = get_json_body();
        $stmt = $pdo->prepare('INSERT INTO expenses (title, amount, category, paid_on, notes) VALUES (:title, :amount, :category, :paid_on, :notes)');
        $stmt->execute([
            ':title' => $data['title'],
            ':amount' => $data['amount'],
            ':category' => $data['category'] ?? null,
            ':paid_on' => normalize_date($data['paid_on'] ?? null),
            ':notes' => $data['notes'] ?? null
        ]);
        json_response(['id' => (int)$pdo->lastInsertId()], 201);
    }

    if ($method === 'PUT' && count($segments) === 2) {
        $expenseId = (int)$segments[1];
        $data = get_json_body();
        $stmt = $pdo->prepare('UPDATE expenses SET title = :title, amount = :amount, category = :category, paid_on = :paid_on, notes = :notes WHERE id = :id');
        $stmt->execute([
            ':title' => $data['title'],
            ':amount' => $data['amount'],
            ':category' => $data['category'] ?? null,
            ':paid_on' => normalize_date($data['paid_on'] ?? null),
            ':notes' => $data['notes'] ?? null,
            ':id' => $expenseId
        ]);
        json_response(['status' => 'updated']);
    }

    if ($method === 'DELETE' && count($segments) === 2) {
        $expenseId = (int)$segments[1];
        $stmt = $pdo->prepare('DELETE FROM expenses WHERE id = :id');
        $stmt->execute([':id' => $expenseId]);
        json_response(['status' => 'deleted']);
    }

    not_found();
}

function handle_certificates(string $method, array $segments, PDO $pdo, array $config): void
{
    if ($method === 'POST' && ($segments[1] ?? '') === 'verify' && ($segments[2] ?? '') === 'enrollment') {
        $data = get_json_body();
        $enrollment = trim($data['enrollment_no'] ?? '');
        $dob = normalize_date($data['dob'] ?? null);
        if (!$enrollment || !$dob) {
            bad_request('Enrollment and DOB are required.');
        }
        $stmt = $pdo->prepare('SELECT certificates.*, students.name AS student_name, students.father_name, students.enrollment_no, students.dob, students.join_date AS student_join_date, students.photo_url, courses.title AS course_title, courses.duration AS course_duration FROM certificates JOIN students ON students.id = certificates.student_id LEFT JOIN courses ON courses.id = certificates.course_id WHERE students.enrollment_no = :enroll AND students.dob = :dob ORDER BY certificates.created_at DESC, certificates.id DESC LIMIT 1');
        $stmt->execute([':enroll' => $enrollment, ':dob' => $dob]);
        $result = $stmt->fetch();
        if (!$result) {
            json_response(['detail' => 'Certificate not found.'], 404);
        }
        json_response($result);
    }

    if ($method === 'GET' && ($segments[1] ?? '') === 'verify' && isset($segments[2])) {
        $code = trim(urldecode((string)$segments[2]));
        if ($code === '') {
            bad_request('Certificate code is required.');
        }
        $stmt = $pdo->prepare('SELECT certificates.*, students.name AS student_name, students.father_name, students.enrollment_no, students.dob, students.join_date AS student_join_date, students.photo_url, courses.title AS course_title, courses.duration AS course_duration FROM certificates JOIN students ON students.id = certificates.student_id LEFT JOIN courses ON courses.id = certificates.course_id WHERE certificates.certificate_code = :code LIMIT 1');
        $stmt->execute([':code' => $code]);
        $result = $stmt->fetch();
        if (!$result) {
            json_response(['detail' => 'Certificate not found.'], 404);
        }
        json_response($result);
    }
    require_admin($pdo);

    if ($method === 'GET' && count($segments) === 3 && $segments[2] === 'pdf') {
        $certId = (int)$segments[1];
        if ($certId <= 0) {
            not_found();
        }
        $stmt = $pdo->prepare(
            'SELECT certificates.*, students.name AS student_name, students.father_name, students.enrollment_no, students.dob, students.join_date AS student_join_date, students.photo_url, courses.title AS course_title, courses.duration AS course_duration
             FROM certificates
             JOIN students ON students.id = certificates.student_id
             LEFT JOIN courses ON courses.id = certificates.course_id
             WHERE certificates.id = :id
             LIMIT 1'
        );
        $stmt->execute([':id' => $certId]);
        $cert = $stmt->fetch();
        if (!$cert) {
            not_found();
        }

        $pdf = build_certificate_template_pdf($cert, $config);
        $token = preg_replace('/[^A-Za-z0-9_-]/', '', (string)($cert['certificate_code'] ?? ''));
        if ($token === '') {
            $token = 'cert-' . $certId;
        }
        $disposition = !empty($_GET['inline']) ? 'inline' : 'attachment';
        header('Content-Type: application/pdf');
        header('Content-Disposition: ' . $disposition . '; filename="certificate-' . $token . '.pdf"');
        header('Content-Length: ' . strlen($pdf));
        echo $pdf;
        exit;
    }

    if ($method === 'GET' && count($segments) === 1) {
        $stmt = $pdo->query('SELECT * FROM certificates ORDER BY created_at DESC');
        json_response($stmt->fetchAll());
    }

    if ($method === 'POST' && count($segments) === 1) {
        $data = get_json_body();
        $stmt = $pdo->prepare('INSERT INTO certificates (student_id, course_id, issued_on, from_date, to_date, certificate_code, qr_url, grade, percentage, status) VALUES (:student_id, :course_id, :issued_on, :from_date, :to_date, :certificate_code, :qr_url, :grade, :percentage, :status)');
        $stmt->execute([
            ':student_id' => $data['student_id'],
            ':course_id' => $data['course_id'],
            ':issued_on' => normalize_date($data['issued_on'] ?? null),
            ':from_date' => normalize_date($data['from_date'] ?? null),
            ':to_date' => normalize_date($data['to_date'] ?? null),
            ':certificate_code' => $data['certificate_code'],
            ':qr_url' => $data['qr_url'] ?? null,
            ':grade' => $data['grade'] ?? null,
            ':percentage' => $data['percentage'] ?? null,
            ':status' => $data['status'] ?? 'valid'
        ]);
        json_response(['id' => (int)$pdo->lastInsertId()], 201);
    }

    if ($method === 'PUT' && count($segments) === 2) {
        $certId = (int)$segments[1];
        $data = get_json_body();
        $stmt = $pdo->prepare('UPDATE certificates SET issued_on = :issued_on, from_date = :from_date, to_date = :to_date, qr_url = :qr_url, grade = :grade, percentage = :percentage, status = :status WHERE id = :id');
        $stmt->execute([
            ':issued_on' => normalize_date($data['issued_on'] ?? null),
            ':from_date' => normalize_date($data['from_date'] ?? null),
            ':to_date' => normalize_date($data['to_date'] ?? null),
            ':qr_url' => $data['qr_url'] ?? null,
            ':grade' => $data['grade'] ?? null,
            ':percentage' => $data['percentage'] ?? null,
            ':status' => $data['status'] ?? 'valid',
            ':id' => $certId
        ]);
        json_response(['status' => 'updated']);
    }

    if ($method === 'DELETE' && count($segments) === 2) {
        $certId = (int)$segments[1];
        $stmt = $pdo->prepare('DELETE FROM certificates WHERE id = :id');
        $stmt->execute([':id' => $certId]);
        json_response(['status' => 'deleted']);
    }

    not_found();
}

function handle_exams(string $method, array $segments, PDO $pdo): void
{
    if ($method === 'GET' && ($segments[1] ?? '') === 'student' && ($segments[2] ?? '') === 'available') {
        require_student($pdo);
        $stmt = $pdo->query('SELECT * FROM exams WHERE is_active = 1 AND (start_at IS NULL OR start_at <= NOW()) AND (end_at IS NULL OR end_at >= NOW()) ORDER BY created_at DESC');
        json_response($stmt->fetchAll());
    }

    if ($method === 'POST' && count($segments) === 3 && $segments[2] === 'start') {
        $student = require_student($pdo);
        $examId = (int)$segments[1];
        $stmt = $pdo->prepare('SELECT * FROM exams WHERE id = :id AND is_active = 1 AND (start_at IS NULL OR start_at <= NOW()) AND (end_at IS NULL OR end_at >= NOW()) LIMIT 1');
        $stmt->execute([':id' => $examId]);
        $exam = $stmt->fetch();
        if (!$exam) {
            not_found();
        }
        $attemptStmt = $pdo->prepare('INSERT INTO exam_attempts (exam_id, student_id, status) VALUES (:exam_id, :student_id, "started")');
        $attemptStmt->execute([':exam_id' => $examId, ':student_id' => $student['id']]);
        $attemptId = (int)$pdo->lastInsertId();

        $questionStmt = $pdo->prepare('SELECT * FROM exam_questions WHERE exam_id = :exam_id ORDER BY id ASC');
        $questionStmt->execute([':exam_id' => $examId]);
        $questions = $questionStmt->fetchAll();
        foreach ($questions as &$question) {
            $optStmt = $pdo->prepare('SELECT id, option_text FROM exam_options WHERE question_id = :qid ORDER BY id ASC');
            $optStmt->execute([':qid' => $question['id']]);
            $question['options'] = $optStmt->fetchAll();
        }
        json_response(['attempt_id' => $attemptId, 'exam' => $exam, 'questions' => $questions]);
    }

    if ($method === 'POST' && count($segments) === 3 && $segments[2] === 'submit') {
        $student = require_student($pdo);
        $examId = (int)$segments[1];
        $data = get_json_body();
        $attemptId = (int)($data['attempt_id'] ?? 0);
        $answers = $data['answers'] ?? [];
        if (!$attemptId) {
            bad_request('Attempt ID is required.');
        }
        if (!is_array($answers)) {
            bad_request('Answers must be an array.');
        }
        $stmt = $pdo->prepare(
            'SELECT exam_attempts.*, exams.duration_minutes, exams.negative_marking_enabled, exams.negative_mark_value
             FROM exam_attempts
             JOIN exams ON exams.id = exam_attempts.exam_id
             WHERE exam_attempts.id = :id AND exam_attempts.exam_id = :exam_id AND exam_attempts.student_id = :student_id
             LIMIT 1'
        );
        $stmt->execute([':id' => $attemptId, ':exam_id' => $examId, ':student_id' => $student['id']]);
        $attempt = $stmt->fetch();
        if (!$attempt) {
            not_found();
        }
        if (($attempt['status'] ?? '') !== 'started') {
            bad_request('This attempt has already been submitted.');
        }
        $startedAt = strtotime((string)($attempt['started_at'] ?? ''));
        $durationSeconds = (int)$attempt['duration_minutes'] * 60;
        if ($startedAt && $durationSeconds > 0 && time() > $startedAt + $durationSeconds + 30) {
            bad_request('The exam time limit has expired.');
        }

        $score = 0.0;
        $seenQuestions = [];
        $evaluatedAnswers = [];
        foreach ($answers as $answer) {
            $questionId = (int)($answer['question_id'] ?? 0);
            $optionId = (int)($answer['option_id'] ?? 0);
            if (!$questionId || !$optionId) {
                bad_request('Every answer must include a question and option.');
            }
            if (isset($seenQuestions[$questionId])) {
                bad_request('A question can only be answered once.');
            }
            $seenQuestions[$questionId] = true;
            $qStmt = $pdo->prepare('SELECT * FROM exam_questions WHERE id = :id AND exam_id = :exam_id LIMIT 1');
            $qStmt->execute([':id' => $questionId, ':exam_id' => $examId]);
            $question = $qStmt->fetch();
            if (!$question) {
                bad_request('Invalid question for this exam.');
            }
            $oStmt = $pdo->prepare('SELECT * FROM exam_options WHERE id = :id AND question_id = :qid LIMIT 1');
            $oStmt->execute([':id' => $optionId, ':qid' => $questionId]);
            $option = $oStmt->fetch();
            if (!$option) {
                bad_request('Invalid option for this question.');
            }
            $isCorrect = $option && $option['is_correct'];
            $marksAwarded = 0.0;
            if ($isCorrect) {
                $marksAwarded = (float)$question['marks'];
            } elseif ((bool)$attempt['negative_marking_enabled']) {
                $negativeMarks = $question['negative_marks'] !== null
                    ? (float)$question['negative_marks']
                    : (float)($attempt['negative_mark_value'] ?? 0);
                $marksAwarded = -1 * $negativeMarks;
            }
            $score += $marksAwarded;
            $evaluatedAnswers[] = [
                'question_id' => $questionId,
                'option_id' => $optionId,
                'is_correct' => $isCorrect ? 1 : 0,
                'marks_awarded' => $marksAwarded
            ];
        }

        $pdo->beginTransaction();
        try {
            $aStmt = $pdo->prepare('INSERT INTO exam_answers (attempt_id, question_id, option_id, is_correct, marks_awarded) VALUES (:attempt_id, :question_id, :option_id, :is_correct, :marks_awarded)');
            foreach ($evaluatedAnswers as $evaluatedAnswer) {
            $aStmt->execute([
                ':attempt_id' => $attemptId,
                    ':question_id' => $evaluatedAnswer['question_id'],
                    ':option_id' => $evaluatedAnswer['option_id'],
                    ':is_correct' => $evaluatedAnswer['is_correct'],
                    ':marks_awarded' => $evaluatedAnswer['marks_awarded']
            ]);
            }
            $update = $pdo->prepare('UPDATE exam_attempts SET total_score = :score, submitted_at = NOW(), status = "submitted" WHERE id = :id AND status = "started"');
            $update->execute([':score' => $score, ':id' => $attemptId]);
            if ($update->rowCount() !== 1) {
                $pdo->rollBack();
                bad_request('This attempt has already been submitted.');
            }
            $pdo->commit();
        } catch (Throwable $e) {
            if ($pdo->inTransaction()) {
                $pdo->rollBack();
            }
            throw $e;
        }
        json_response(['total_score' => $score, 'status' => 'submitted']);
    }

    require_admin($pdo);

    if ($method === 'GET' && count($segments) === 1) {
        $stmt = $pdo->query('SELECT * FROM exams ORDER BY created_at DESC');
        json_response($stmt->fetchAll());
    }

    if ($method === 'GET' && count($segments) === 3 && $segments[2] === 'questions') {
        $examId = (int)$segments[1];
        $stmt = $pdo->prepare('SELECT * FROM exam_questions WHERE exam_id = :exam_id ORDER BY id DESC');
        $stmt->execute([':exam_id' => $examId]);
        $questions = $stmt->fetchAll();
        foreach ($questions as &$question) {
            $optStmt = $pdo->prepare('SELECT * FROM exam_options WHERE question_id = :qid ORDER BY id ASC');
            $optStmt->execute([':qid' => $question['id']]);
            $question['options'] = $optStmt->fetchAll();
        }
        json_response($questions);
    }

    if ($method === 'POST' && count($segments) === 1) {
        $data = get_json_body();
        $stmt = $pdo->prepare('INSERT INTO exams (title, description, duration_minutes, total_marks, pass_marks, negative_marking_enabled, negative_mark_value, is_active, start_at, end_at) VALUES (:title, :description, :duration_minutes, :total_marks, :pass_marks, :negative_marking_enabled, :negative_mark_value, :is_active, :start_at, :end_at)');
        $stmt->execute([
            ':title' => $data['title'],
            ':description' => $data['description'] ?? null,
            ':duration_minutes' => $data['duration_minutes'],
            ':total_marks' => $data['total_marks'] ?? null,
            ':pass_marks' => $data['pass_marks'] ?? null,
            ':negative_marking_enabled' => parse_bool($data['negative_marking_enabled'] ?? 'false') ? 1 : 0,
            ':negative_mark_value' => $data['negative_mark_value'] ?? null,
            ':is_active' => parse_bool($data['is_active'] ?? 'true') ? 1 : 0,
            ':start_at' => $data['start_at'] ?? null,
            ':end_at' => $data['end_at'] ?? null
        ]);
        json_response(['id' => (int)$pdo->lastInsertId()], 201);
    }

    if ($method === 'PUT' && count($segments) === 2) {
        $examId = (int)$segments[1];
        $data = get_json_body();
        $stmt = $pdo->prepare('UPDATE exams SET title = :title, description = :description, duration_minutes = :duration_minutes, total_marks = :total_marks, pass_marks = :pass_marks, negative_marking_enabled = :negative_marking_enabled, negative_mark_value = :negative_mark_value, is_active = :is_active, start_at = :start_at, end_at = :end_at WHERE id = :id');
        $stmt->execute([
            ':title' => $data['title'],
            ':description' => $data['description'] ?? null,
            ':duration_minutes' => $data['duration_minutes'],
            ':total_marks' => $data['total_marks'] ?? null,
            ':pass_marks' => $data['pass_marks'] ?? null,
            ':negative_marking_enabled' => parse_bool($data['negative_marking_enabled'] ?? 'false') ? 1 : 0,
            ':negative_mark_value' => $data['negative_mark_value'] ?? null,
            ':is_active' => parse_bool($data['is_active'] ?? 'true') ? 1 : 0,
            ':start_at' => $data['start_at'] ?? null,
            ':end_at' => $data['end_at'] ?? null,
            ':id' => $examId
        ]);
        json_response(['status' => 'updated']);
    }

    if ($method === 'DELETE' && count($segments) === 2) {
        $examId = (int)$segments[1];
        $stmt = $pdo->prepare('DELETE FROM exams WHERE id = :id');
        $stmt->execute([':id' => $examId]);
        json_response(['status' => 'deleted']);
    }

    if ($method === 'POST' && count($segments) === 3 && $segments[2] === 'questions') {
        $examId = (int)$segments[1];
        $data = get_json_body();
        $stmt = $pdo->prepare('INSERT INTO exam_questions (exam_id, question_text, marks, negative_marks) VALUES (:exam_id, :question_text, :marks, :negative_marks)');
        $stmt->execute([
            ':exam_id' => $examId,
            ':question_text' => $data['question_text'],
            ':marks' => $data['marks'] ?? 1,
            ':negative_marks' => $data['negative_marks'] ?? null
        ]);
        $questionId = (int)$pdo->lastInsertId();
        $options = $data['options'] ?? [];
        foreach ($options as $option) {
            $optStmt = $pdo->prepare('INSERT INTO exam_options (question_id, option_text, is_correct) VALUES (:question_id, :option_text, :is_correct)');
            $optStmt->execute([
                ':question_id' => $questionId,
                ':option_text' => $option['option_text'],
                ':is_correct' => !empty($option['is_correct']) ? 1 : 0
            ]);
        }
        json_response(['id' => $questionId], 201);
    }

    if ($method === 'DELETE' && count($segments) === 3 && $segments[1] === 'questions') {
        $questionId = (int)$segments[2];
        $stmt = $pdo->prepare('DELETE FROM exam_questions WHERE id = :id');
        $stmt->execute([':id' => $questionId]);
        json_response(['status' => 'deleted']);
    }

    not_found();
}




