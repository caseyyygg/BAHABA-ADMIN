<?php
$pdo = new PDO(
    'mysql:host=127.0.0.1;dbname=bahaba;charset=utf8mb4',
    'bahaba_user',
    'BahabaApp123!',
    [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    ]
);

$email = 'jakesh1larios@gmail.com';
$stmt = $pdo->prepare('UPDATE users SET email_verified_at = NOW() WHERE email = :email');
$stmt->execute(['email' => $email]);

$row = $pdo->prepare('SELECT id, email, email_verified_at FROM users WHERE email = :email');
$row->execute(['email' => $email]);
print_r($row->fetch());
