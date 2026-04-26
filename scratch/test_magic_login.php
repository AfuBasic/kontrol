<?php

require __DIR__.'/../vendor/autoload.php';
$app = require_once __DIR__.'/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Actions\Auth\GenerateMagicLoginUrlAction;
use App\Models\User;

$user = User::first();
if (! $user) {
    echo "User not found\n";
    exit;
}

$action = new GenerateMagicLoginUrlAction;
$url = $action->execute($user, '/resident/billing');

echo "Magic URL for {$user->email}:\n";
echo $url."\n";
