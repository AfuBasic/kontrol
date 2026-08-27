<?php

use App\Http\Controllers\Account\SupportController;
use App\Http\Controllers\Account\TrustedDeviceController;
use App\Http\Controllers\Auth\ContextController;
use App\Http\Controllers\Auth\DeviceAuthorizationController;
use App\Http\Controllers\Auth\EmailVerificationController;
use App\Http\Controllers\Auth\InvitationAcceptanceController;
use App\Http\Controllers\Auth\InviteRegistrationController;
use App\Http\Controllers\Auth\LoginController;
use App\Http\Controllers\Auth\LoginOtpController;
use App\Http\Controllers\Auth\MagicLoginController;
use App\Http\Controllers\Auth\SocialLoginController;
use App\Http\Controllers\Platform\InstallExperienceController;
use App\Http\Controllers\PublicPassController;
use App\Http\Controllers\PushSubscriptionController;
use App\Http\Controllers\Telegram\TelegramWebhookController;
use App\Http\Controllers\Web\CollectionPaymentController;
use App\Http\Controllers\Web\LandingController;
use App\Http\Controllers\Webhooks\PaystackWebhookController;
use App\Http\Controllers\Zeus\InvitationController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Authentication Routes
|--------------------------------------------------------------------------
*/
Route::middleware('guest')->group(function (): void {
    Route::get('/login', [LoginController::class, 'show'])->name('login');
    Route::post('/login', [LoginController::class, 'store'])->middleware('throttle:login');

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

    Route::get('/login/device', [DeviceAuthorizationController::class, 'show'])->name('login.device.show');
    Route::get('/login/device/status', [DeviceAuthorizationController::class, 'status'])->name('login.device.status');
    Route::post('/login/device/continue', [DeviceAuthorizationController::class, 'continue'])->name('login.device.continue');
    Route::post('/login/device/resend', [DeviceAuthorizationController::class, 'resend'])
        ->middleware('throttle:device-authorization-resend')
        ->name('login.device.resend');
    Route::post('/login/device/abort', [DeviceAuthorizationController::class, 'abort'])->name('login.device.abort');

    // Invite Link Registration
    Route::get('/join/{token}', [InviteRegistrationController::class, 'show'])->name('invite.join');
    Route::post('/join/{token}', [InviteRegistrationController::class, 'store'])->name('invite.join.store');

});

// Magic Login
Route::get('/auth/magic-login/{token}', [MagicLoginController::class, 'show'])
    ->middleware('signed')
    ->name('auth.magic-login');

Route::get('/device-authorization/{authorization}/approve', [DeviceAuthorizationController::class, 'approve'])
    ->middleware('signed')
    ->name('device-authorization.approve');
Route::get('/device-authorization/{authorization}/deny', [DeviceAuthorizationController::class, 'deny'])
    ->middleware('signed')
    ->name('device-authorization.deny');

// Public Invitation Acceptance Routes
Route::get('/invitations/{token}', [InvitationAcceptanceController::class, 'show'])->name('invitations.show');
Route::post('/invitations/{token}/accept', [InvitationAcceptanceController::class, 'accept'])->name('invitations.accept');

// Email Verification
Route::get('/email/verify/{id}/{hash}', [EmailVerificationController::class, 'verify'])
    ->middleware(['signed', 'throttle:6,1'])
    ->name('verification.verify');

Route::middleware('auth')->group(function () {
    Route::post('/logout', [LoginController::class, 'destroy'])->name('logout');

    Route::get('/context/select', [ContextController::class, 'index'])->name('context.select');
    Route::post('/context/switch', [ContextController::class, 'switch'])->name('context.switch');

    Route::get('/account/devices', [TrustedDeviceController::class, 'index'])->name('account.devices.index');
    Route::delete('/account/devices/{device}', [TrustedDeviceController::class, 'destroy'])->name('account.devices.destroy');

    Route::get('/account/support', [SupportController::class, 'index'])->name('account.support.index');
});

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
    Route::get('/success', [InvitationController::class, 'success'])->name('success');
    Route::get('/{token}', [InvitationController::class, 'show'])->name('accept');
    Route::post('/{token}', [InvitationController::class, 'store'])->name('store');
    Route::get('/error/invalid', [InvitationController::class, 'invalid'])->name('invalid');
});

/*
|--------------------------------------------------------------------------
| External Webhooks (Telegram, Paystack)
|--------------------------------------------------------------------------
*/
Route::post('/telegram/webhook', TelegramWebhookController::class)->name('telegram.webhook');
Route::post('/webhooks/paystack', PaystackWebhookController::class)->name('webhooks.paystack');

/*
|--------------------------------------------------------------------------
| Web-based Collection Payments
|--------------------------------------------------------------------------
*/
Route::get('/billing/collection/status/{reference}', [CollectionPaymentController::class, 'status'])->name('web.billing.collection.status');
Route::get('/billing/collection/{assignment}', [CollectionPaymentController::class, 'show'])->name('web.billing.collection.show');
Route::get('/billing/collections/bulk', [CollectionPaymentController::class, 'showBulk'])->name('web.billing.collections.show_bulk');
Route::post('/billing/collection/{assignment}/initiate', [CollectionPaymentController::class, 'initiate'])->name('web.billing.collection.initiate');
Route::post('/billing/collections/bulk/initiate', [CollectionPaymentController::class, 'initiateBulk'])->name('web.billing.collections.initiate_bulk');
Route::post('/billing/collection/verify/{reference}', [CollectionPaymentController::class, 'verify'])->name('web.billing.collection.verify');

Route::get('/download-app', [LandingController::class, 'downloadApp'])->name('landing.download');
Route::get('/pass/{uuid}', [PublicPassController::class, 'show'])->name('public.pass');

/*
|--------------------------------------------------------------------------
| Platform Access Experience Routes
|--------------------------------------------------------------------------
*/
Route::prefix('platform')->name('platform.')->group(function (): void {
    Route::get('/install/android', [InstallExperienceController::class, 'androidInstall'])->name('install.android');
    Route::get('/install/ios', [InstallExperienceController::class, 'iosDownload'])->name('install.ios');
    Route::get('/unsupported', [InstallExperienceController::class, 'unsupported'])->name('unsupported');
});
