<?php

use App\Http\Controllers\Resident\AccessCodeController;
use App\Http\Controllers\Resident\ActivityController;
use App\Http\Controllers\Resident\BillingController;
use App\Http\Controllers\Resident\CollectionController;
use App\Http\Controllers\Resident\EmergencyContactController;
use App\Http\Controllers\Resident\EstateBoardCommentController;
use App\Http\Controllers\Resident\EstateBoardController;
use App\Http\Controllers\Resident\EstateContactController;
use App\Http\Controllers\Resident\HomeController;
use App\Http\Controllers\Resident\HouseholdMemberController;
use App\Http\Controllers\Resident\NotificationController;
use App\Http\Controllers\Resident\PasswordController;
use App\Http\Controllers\Resident\PaymentCallbackController;
use App\Http\Controllers\Resident\ProfileController;
use App\Http\Controllers\Resident\SosController;
use App\Http\Controllers\Resident\TelegramLinkController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Resident Routes
|--------------------------------------------------------------------------
|
| Routes for estate residents and household members.
| Shared routes are accessible by both 'resident' and 'household_member' roles.
| Primary-resident-only routes require the 'resident' role exclusively.
|
*/

// ──────────────────────────────────────────────────────────────
// Shared routes: accessible by both residents and household members
// ──────────────────────────────────────────────────────────────
Route::middleware('role:resident,household_member')->group(function (): void {
    // Legacy dashboard redirect
    Route::get('/dashboard', fn () => redirect()->route('resident.home'))->name('resident.dashboard');

    // New consumer-style home
    Route::get('/home', HomeController::class)->name('resident.home');

    // Profile
    Route::get('/profile', [ProfileController::class, 'edit'])->name('resident.profile');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('resident.profile.update');
    Route::put('/password', [PasswordController::class, 'update'])->name('resident.password.update');

    // Activity feed & Notifications
    Route::middleware('check-estate-feature:real-time-visit-feed')->group(function (): void {
        Route::get('/activity', ActivityController::class)->name('resident.activity');
    });
    Route::post('/notifications/{id}/read', [NotificationController::class, 'markAsRead'])->name('resident.notifications.read');
    Route::post('/notifications/read-all', [NotificationController::class, 'markAllAsRead'])->name('resident.notifications.read-all');
    Route::post('/notifications/clear-all', [NotificationController::class, 'clearAll'])->name('resident.notifications.clear-all');

    // Estate Contacts
    Route::middleware('check-estate-feature:estate-contacts')->group(function (): void {
        Route::get('/contacts', [EstateContactController::class, 'index'])->name('resident.contacts.index');
        Route::get('/contacts/json', [EstateContactController::class, 'apiIndex'])->name('resident.contacts.json');
    });

    // Access Code Generation and Visitor Management
    Route::middleware('check-estate-feature:access-code-generation')->group(function (): void {
        Route::middleware('resident.active')->group(function (): void {
            Route::post('/visitors', [AccessCodeController::class, 'store'])->name('resident.visitors.store');
        });
        Route::get('/visitors/{accessCode}/success', [AccessCodeController::class, 'success'])->name('resident.visitors.success');

        Route::get('/visitors', [AccessCodeController::class, 'index'])->name('resident.visitors.index');
        Route::get('/visitors/{accessCode}', [AccessCodeController::class, 'show'])->name('resident.visitors.show');
        Route::post('/visitors/{accessCode}/share', [AccessCodeController::class, 'share'])->name('resident.visitors.share');
        Route::delete('/visitors/{accessCode}', [AccessCodeController::class, 'destroy'])->name('resident.visitors.destroy');
    });

    // Estate Board (read-only + comments)
    Route::prefix('estate-board')->name('resident.estate-board.')->middleware('check-estate-feature:interactive-notice-board')->group(function (): void {
        Route::get('/', [EstateBoardController::class, 'index'])->name('index');
        Route::get('/{post}', [EstateBoardController::class, 'show'])->name('show');

        // Rate-limited comment routes
        Route::middleware('throttle:estate-board-comments')->group(function (): void {
            Route::post('/{post}/comments', [EstateBoardCommentController::class, 'store'])->name('comments.store');
            Route::delete('/comments/{comment}', [EstateBoardCommentController::class, 'destroy'])->name('comments.destroy');
        });
    });

    // Telegram Account Linking
    Route::prefix('telegram')->name('resident.telegram.')->middleware('check-estate-feature:telegram-bot-integration')->group(function (): void {
        Route::post('/generate-otp', [TelegramLinkController::class, 'generateOtp'])->name('generate-otp');
        Route::delete('/unlink', [TelegramLinkController::class, 'unlink'])->name('unlink');
        Route::get('/status', [TelegramLinkController::class, 'status'])->name('status');
    });

    // SOS Emergency
    Route::post('/sos/trigger', [SosController::class, 'trigger'])->name('resident.sos.trigger');

    // Emergency Contacts Management
    Route::prefix('emergency-contacts')->name('resident.emergency-contacts.')->group(function (): void {
        Route::post('/', [EmergencyContactController::class, 'store'])->name('store');
        Route::delete('/{emergencyContact}', [EmergencyContactController::class, 'destroy'])->name('destroy');
    });
});

// ──────────────────────────────────────────────────────────────
// Primary resident only: billing & household management
// ──────────────────────────────────────────────────────────────
Route::middleware('role:resident')->group(function (): void {
    // Billing
    Route::prefix('billing')->name('resident.billing.')->group(function (): void {
        Route::get('/', [BillingController::class, 'index'])->name('index');
        Route::patch('/preference', [BillingController::class, 'updatePreference'])->name('preference.update');
        Route::post('/pay', [BillingController::class, 'payOutstanding'])->name('pay-outstanding');
        Route::post('/setup-payment', [BillingController::class, 'setupPaymentMethod'])->name('setup-payment');
        Route::post('/invoices/{invoice}/pay', [BillingController::class, 'pay'])->name('invoices.pay');
        Route::get('/payment/callback', PaymentCallbackController::class)->name('payment.callback');
        Route::get('/magic-url', [BillingController::class, 'generateMagicUrl'])->name('magic-url');
    });

    // Estate Collections (Dues)
    Route::prefix('dues')->name('resident.collections.')->middleware('check-estate-feature:payment-collection')->group(function (): void {
        Route::get('/', [CollectionController::class, 'index'])->name('index');
        Route::get('/{assignment}', [CollectionController::class, 'show'])->name('show');
        Route::post('/{assignment}/verify', [CollectionController::class, 'verify'])->name('verify');
    });

    // Household Management
    Route::prefix('household')->name('resident.household.')->middleware('check-estate-feature:household-management')->group(function (): void {
        Route::get('/', [HouseholdMemberController::class, 'index'])->name('index');
        Route::middleware('resident.active')->post('/', [HouseholdMemberController::class, 'store'])->name('store');
        Route::post('/{householdMember}/reset-password', [HouseholdMemberController::class, 'resetPassword'])->name('reset-password');
        Route::delete('/{householdMember}', [HouseholdMemberController::class, 'destroy'])->name('destroy');
    });
});
