<?php

use App\Actions\Auth\GenerateLoginOtp;
use App\Mail\Auth\LoginOtpMail;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;

uses(RefreshDatabase::class);

it('shows the masked email on the code screen in the same style as the device screen', function () {
    $user = User::factory()->create(['email' => 'afutunde@gmail.com']);

    $this->withSession(['otp_user_id' => $user->id])
        ->get(route('login.otp.show'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('Auth/VerifyOtp')
            ->where('email', 'a•••••e@gmail.com')
        );
});

it('sends the sign-in code on the default queue unless one is configured', function () {
    Mail::fake();
    $user = User::factory()->create();

    app(GenerateLoginOtp::class)->execute($user, Request::create('/login', 'POST'));

    Mail::assertQueued(LoginOtpMail::class, fn (LoginOtpMail $mail) => $mail->queue === 'default');
});

it('sends the sign-in code on the dedicated queue when OTP_QUEUE is set', function () {
    Mail::fake();
    config(['queue.otp_queue' => 'auth']);
    $user = User::factory()->create();

    app(GenerateLoginOtp::class)->execute($user, Request::create('/login', 'POST'));

    Mail::assertQueued(LoginOtpMail::class, fn (LoginOtpMail $mail) => $mail->queue === 'auth');
});
