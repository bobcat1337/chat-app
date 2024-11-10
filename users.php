<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST');

$usersFile = 'users.json';

// Opprett fil hvis den ikke eksisterer
if (!file_exists($usersFile)) {
    file_put_contents($usersFile, json_encode([]));
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    $action = $data['action'] ?? '';

    if ($action === 'register') {
        $username = $data['username'] ?? '';
        $password = $data['password'] ?? '';

        $users = json_decode(file_get_contents($usersFile), true);

        if (isset($users[$username])) {
            echo json_encode(['success' => false, 'message' => 'Brukernavnet er allerede i bruk']);
            exit;
        }

        $users[$username] = password_hash($password, PASSWORD_DEFAULT);
        file_put_contents($usersFile, json_encode($users));
        echo json_encode(['success' => true]);
    }
    elseif ($action === 'login') {
        $username = $data['username'] ?? '';
        $password = $data['password'] ?? '';

        $users = json_decode(file_get_contents($usersFile), true);

        if (isset($users[$username]) && password_verify($password, $users[$username])) {
            echo json_encode(['success' => true]);
        } else {
            echo json_encode(['success' => false, 'message' => 'Feil brukernavn eller passord']);
        }
    }
}
?> 