<?php

use App\Actions\Telegram\GenerateTelegramOtpAction;
use App\Models\Estate;
use App\Models\TelegramLinkToken;
use App\Models\User;
use App\Services\Telegram\TelegramMessageHandler;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;

uses(RefreshDatabase::class);

beforeEach(function () {
    Role::firstOrCreate(['name' => 'resident']);
});

test('it can link a telegram account using raw otp', function () {
    $estate = Estate::factory()->create();
    $user = User::factory()->create();

    setPermissionsTeamId($estate->id);
    $user->assignRole('resident');
    $user->estates()->attach($estate->id, ['status' => 'accepted']);

    // Generate OTP
    $action = app(GenerateTelegramOtpAction::class);
    $result = $action->execute($user);

    $token = $result['token'];
    expect($token)->not->toBeNull();

    // Mock Telegram bot service
    $this->mock(\App\Services\Telegram\TelegramBotService::class, function ($mock) {
        $mock->shouldReceive('sendMessage')->once()->andReturn(true);
    });

    // Handle Telegram message
    $handler = app(TelegramMessageHandler::class);
    $handler->handle([
        'chat' => ['id' => 987654321],
        'text' => $token,
        'from' => ['first_name' => 'TestUser'],
    ]);

    // Assert account linked
    $user->refresh();
    expect($user->telegram_chat_id)->toBe('987654321');

    // Assert token marked as used
    $dbToken = TelegramLinkToken::where('token', $token)->first();
    expect($dbToken->used_at)->not->toBeNull();
});

test('it can link a telegram account using start parameter', function () {
    $estate = Estate::factory()->create();
    $user = User::factory()->create();

    setPermissionsTeamId($estate->id);
    $user->assignRole('resident');
    $user->estates()->attach($estate->id, ['status' => 'accepted']);

    // Generate OTP
    $action = app(GenerateTelegramOtpAction::class);
    $result = $action->execute($user);

    $token = $result['token'];

    // Mock Telegram bot service
    $this->mock(\App\Services\Telegram\TelegramBotService::class, function ($mock) {
        $mock->shouldReceive('sendMessage')->once()->andReturn(true);
    });

    // Handle Telegram message
    $handler = app(TelegramMessageHandler::class);
    $handler->handle([
        'chat' => ['id' => 123456789],
        'text' => '/start ' . $token,
        'from' => ['first_name' => 'TestUser'],
    ]);

    // Assert account linked
    $user->refresh();
    expect($user->telegram_chat_id)->toBe('123456789');
});
