<?php
require getenv('HOME') . '/public_html/pragati-api/src/bootstrap.php';
$pdo->exec('CREATE TABLE IF NOT EXISTS student_portal_access (student_id INT NOT NULL PRIMARY KEY, permissions TEXT NOT NULL, FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4');
echo "Student portal access storage ready.\n";
