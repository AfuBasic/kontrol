<?php

use App\Http\Controllers\Auth\EmailVerificationController;
use App\Http\Controllers\Auth\ForgotPasswordController;
use App\Http\Controllers\Auth\InviteRegistrationController;
use App\Http\Controllers\Auth\LoginController;
use App\Http\Controllers\Auth\LoginOtpController;
use App\Http\Controllers\Auth\MagicLoginController;
use App\Http\Controllers\Auth\ResetPasswordController;
use App\Http\Controllers\Auth\SocialLoginController;
use App\Http\Controllers\PushSubscriptionController;
use App\Http\Controllers\Telegram\TelegramWebhookController;
use App\Http\Controllers\Webhooks\PaystackWebhookController;
use App\Http\Controllers\Zeus\InvitationController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return to_route('login');
})->name('home');

/*
|--------------------------------------------------------------------------
| Authentication Routes
|--------------------------------------------------------------------------
*/
Route::middleware('guest')->group(function (): void {
    Route::get('/login', [LoginController::class, 'show'])->name('login');
    Route::post('/login', [LoginController::class, 'store']);

    // Google OAuth
    Route::get('/auth/google', [SocialLoginController::class, 'redirectToGoogle'])->name('auth.google');
    Route::get('/auth/google/callback', [SocialLoginController::class, 'handleGoogleCallback']);
    Route::post('/auth/google/mobile', [SocialLoginController::class, 'handleGoogleMobileToken'])->name('auth.google.mobile');

    // OTP Verification (new device)
    Route::get('/login/verify', [LoginOtpController::class, 'show'])->name('login.otp.show');
    Route::post('/login/verify', [LoginOtpController::class, 'verify'])
        ->middleware('throttle:5,1')
        ->name('login.otp.verify');
    Route::post('/login/verify/resend', [LoginOtpController::class, 'resend'])
        ->middleware('throttle:3,1')
        ->name('login.otp.resend');

    // Password Reset
    Route::get('/forgot-password', [ForgotPasswordController::class, 'show'])->name('password.request');
    Route::post('/forgot-password', [ForgotPasswordController::class, 'store'])
        ->middleware('throttle:3,1')
        ->name('password.email');
    Route::get('/reset-password/{token}', [ResetPasswordController::class, 'show'])->name('password.reset');
    Route::post('/reset-password', [ResetPasswordController::class, 'store'])->name('password.update');

    // Invite Link Registration
    Route::get('/join/{token}', [InviteRegistrationController::class, 'show'])->name('invite.join');
    Route::post('/join/{token}', [InviteRegistrationController::class, 'store'])->name('invite.join.store');

});

// Magic Login
Route::get('/auth/magic-login/{token}', [MagicLoginController::class, 'show'])
    ->middleware('signed')
    ->name('auth.magic-login');

// Email Verification
Route::get('/email/verify/{id}/{hash}', [EmailVerificationController::class, 'verify'])
    ->middleware(['signed', 'throttle:6,1'])
    ->name('verification.verify');

Route::post('/logout', [LoginController::class, 'destroy'])
    ->middleware('auth')
    ->name('logout');

/*
|--------------------------------------------------------------------------
| Legal Pages
|--------------------------------------------------------------------------
*/
Route::get('/privacy', fn () => Inertia::render('legal/privacy'))->name('privacy');
Route::get('/terms', fn () => Inertia::render('legal/terms'))->name('terms');

/*
|--------------------------------------------------------------------------
| Push Notification Subscription Routes
|--------------------------------------------------------------------------
*/
Route::prefix('push')->name('push.')->group(function (): void {
    Route::get('/vapid-public-key', [PushSubscriptionController::class, 'vapidPublicKey'])->name('vapid');
    Route::middleware('auth')->group(function (): void {
        Route::post('/subscribe', [PushSubscriptionController::class, 'store'])->name('subscribe');
        Route::post('/unsubscribe', [PushSubscriptionController::class, 'destroy'])->name('unsubscribe');
    });
});

/*
|--------------------------------------------------------------------------
| Estate Invitation Routes (public, signature-validated)
|--------------------------------------------------------------------------
*/
Route::prefix('invitation')->name('invitation.')->group(function (): void {
    Route::get('/{user}', [InvitationController::class, 'show'])->middleware('signed')->name('accept');
    Route::post('/{user}', [InvitationController::class, 'store'])->middleware('signed')->name('store');
    Route::get('/error/invalid', [InvitationController::class, 'invalid'])->name('invalid');
});

/*
|--------------------------------------------------------------------------
| Telegram Webhook Route
|--------------------------------------------------------------------------
| This route handles incoming webhooks from Telegram Bot API.
| CSRF protection is disabled for this route in bootstrap/app.php.
*/
Route::post('/telegram/webhook', TelegramWebhookController::class)->name('telegram.webhook');

/*
|--------------------------------------------------------------------------
| Paystack Webhook Route
|--------------------------------------------------------------------------
| This route handles incoming webhooks from Paystack payment gateway.
| CSRF protection is disabled for this route in bootstrap/app.php.
*/
Route::post('/webhooks/paystack', PaystackWebhookController::class)->name('webhooks.paystack');

// Web-based Collection Payments
Route::get('/billing/collection/{assignment}', [\App\Http\Controllers\Web\CollectionPaymentController::class, 'show'])->name('web.billing.collection.show');
Route::post('/billing/collection/{assignment}/initiate', [\App\Http\Controllers\Web\CollectionPaymentController::class, 'initiate'])->name('web.billing.collection.initiate');
