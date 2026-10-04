<?php
$config = require __DIR__ . '/../BAHABA-official/bahaba-app/api/config.php';

$pdo = new PDO(
    $config['db']['dsn'],
    $config['db']['username'],
    $config['db']['password'],
    [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    ]
);

$pdo->exec("CREATE TABLE IF NOT EXISTS admin_users (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(254) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('platform-admin','lgu-admin') NOT NULL DEFAULT 'lgu-admin',
    city VARCHAR(150) NULL,
    org VARCHAR(255) NULL,
    barangay VARCHAR(150) NULL,
    status ENUM('active','disabled','pending') NOT NULL DEFAULT 'active',
    acls JSON NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
)");

$users = [
    [
        'name' => 'Miguel Torres',
        'email' => 'miguel.torres@bahaba.ph',
        'password' => 'Bahaba@2026',
        'role' => 'platform-admin',
        'city' => 'Metro Manila (All Cities)',
        'org' => 'BAHABA Platform Admin',
        'barangay' => null,
        'status' => 'active',
        'acls' => json_encode([
            'admin_overview' => 'full',
            'announcements' => 'full',
            'products' => 'full',
            'approval_board' => 'full',
            'approval_board_hr' => 'full',
        ]),
    ],
    [
        'name' => 'Elena Villareal',
        'email' => 'elena.villareal@malabon.gov.ph',
        'password' => 'Concepcion@2026',
        'role' => 'lgu-admin',
        'city' => 'Malabon City',
        'org' => 'Brgy. Concepcion',
        'barangay' => 'Concepcion',
        'status' => 'active',
        'acls' => json_encode([
            'admin_overview' => 'view',
            'announcements' => 'edit',
            'products' => 'edit',
            'approval_board' => 'edit',
            'approval_board_hr' => 'no_access',
        ]),
    ],
];

foreach ($users as $user) {
    $stmt = $pdo->prepare(
        'INSERT INTO admin_users (name, email, password_hash, role, city, org, barangay, status, acls)
         VALUES (:name, :email, :password_hash, :role, :city, :org, :barangay, :status, :acls)
         ON DUPLICATE KEY UPDATE
           name = VALUES(name),
           password_hash = VALUES(password_hash),
           role = VALUES(role),
           city = VALUES(city),
           org = VALUES(org),
           barangay = VALUES(barangay),
           status = VALUES(status),
           acls = VALUES(acls)'
    );

    $stmt->execute([
        'name' => $user['name'],
        'email' => $user['email'],
        'password_hash' => password_hash($user['password'], PASSWORD_DEFAULT),
        'role' => $user['role'],
        'city' => $user['city'],
        'org' => $user['org'],
        'barangay' => $user['barangay'],
        'status' => $user['status'],
        'acls' => $user['acls'],
    ]);
}

$rows = $pdo->query("SELECT name, email, role, city, status FROM admin_users WHERE email IN ('miguel.torres@bahaba.ph','elena.villareal@malabon.gov.ph')")->fetchAll();

echo json_encode($rows, JSON_PRETTY_PRINT), PHP_EOL;
