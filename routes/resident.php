<?php

use App\Http\Controllers\Resident\AccessCodeController;
use App\Http\Controllers\Resident\ActivityController;
use App\Http\Controllers\Resident\BillingController;
use App\Http\Controllers\Resident\CollectionController;
use App\Http\Controllers\Resident\ComplianceController;
use App\Http\Controllers\Resident\CouponController;
use App\Http\Controllers\Resident\EmergencyContactController;
use App\Http\Controllers\Resident\EstateBoardCommentController;
use App\Http\Controllers\Resident\EstateBoardController;
use App\Http\Controllers\Resident\EstateContactController;
use App\Http\Controllers\Resident\HomeController;
use App\Http\Controllers\Resident\HouseholdMemberController;
use App\Http\Controllers\Resident\IncidentCloseController;
use App\Http\Controllers\Resident\IncidentCommentController;
use App\Http\Controllers\Resident\IncidentController;
use App\Http\Controllers\Resident\IncidentUpvoteController;
use App\Http\Controllers\Resident\NotificationController;
use App\Http\Controllers\Resident\PasswordController;
use App\Http\Controllers\Resident\PaymentCallbackController;
use App\Http\Controllers\Resident\ProfileController;
use App\Http\Controllers\Resident\PropertyOwner\AnnouncementController as POAnnouncementController;
use App\Http\Controllers\Resident\PropertyOwner\CollectionController as POCollectionController;
use App\Http\Controllers\Resident\PropertyOwner\DashboardController as PODashboardController;
use App\Http\Controllers\Resident\PropertyOwner\PropertyController as POPropertyController;
use App\Http\Controllers\Resident\PropertyOwner\ResidentController as POResidentController;
use App\Http\Controllers\Resident\PropertyOwner\SettlementController as POSettlementController;
use App\Http\Controllers\Resident\SosController;
use App\Http\Controllers\Resident\TelegramLinkController;
use App\Http\Controllers\Resident\VisitorPassReminderController;
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
// Shared routes: accessible by residents, household members, and property owners
// ──────────────────────────────────────────────────────────────
Route::middleware('role:resident,household_member,property_owner')->group(function (): void {
    // Legacy dashboard redirect
    Route::get('/dashboard', fn () => redirect()->route('resident.home'))->name('resident.dashboard');

    // New consumer-style home
    Route::get('/home', HomeController::class)->name('resident.home');

    // Resident Compliance Dashboard & Timeline
    Route::get('/compliance', [ComplianceController::class, 'index'])->name('resident.compliance.index');
    Route::get('/compliance/violations/{violation}/timeline', [ComplianceController::class, 'timeline'])->name('resident.compliance.timeline');

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

        Route::get('/visitors/create', [AccessCodeController::class, 'create'])->name('resident.visitors.create');
        Route::get('/visitors/calendar', [AccessCodeController::class, 'calendar'])->name('resident.visitors.calendar');
        Route::get('/visitors/calendar-events', [AccessCodeController::class, 'calendarEvents'])->name('resident.visitors.calendar-events');
        Route::get('/visitors', [AccessCodeController::class, 'index'])->name('resident.visitors.index');
        Route::get('/visitors/{accessCode}', [AccessCodeController::class, 'show'])->name('resident.visitors.show');
        Route::post('/visitors/{accessCode}/share', [AccessCodeController::class, 'share'])->name('resident.visitors.share');
        Route::post('/visitors/{accessCode}/extend', [AccessCodeController::class, 'extend'])->name('resident.visitors.extend');
        Route::post('/visitors/{accessCode}/reminder', [VisitorPassReminderController::class, 'store'])->name('resident.visitors.reminder.store');
        Route::delete('/visitors/{accessCode}/reminder', [VisitorPassReminderController::class, 'destroy'])->name('resident.visitors.reminder.destroy');
        Route::delete('/visitors/{accessCode}', [AccessCodeController::class, 'destroy'])->name('resident.visitors.destroy');
    });

    // Estate Board (read-only + comments)
    Route::prefix('estate-board')->name('resident.estate-board.')->middleware(['check-estate-feature:interactive-notice-board', 'resident.active'])->group(function (): void {
        Route::get('/', [EstateBoardController::class, 'index'])->name('index');
        Route::get('/{post}', [EstateBoardController::class, 'show'])
            ->name('show')
            ->missing(function () {
                return redirect()->route('resident.estate-board.index')->with('error', 'This announcement no longer exists.');
            });

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
        Route::middleware('resident.active')->group(function (): void {
            Route::post('/', [EmergencyContactController::class, 'store'])->name('store');
            Route::delete('/{emergencyContact}', [EmergencyContactController::class, 'destroy'])->name('destroy');
        });
    });
});

// ──────────────────────────────────────────────────────────────
// Primary resident & Property owner: billing & household management
// ──────────────────────────────────────────────────────────────
Route::middleware('role:resident,property_owner')->group(function (): void {
    // Coupons
    Route::get('/coupons', [CouponController::class, 'index'])->name('resident.coupons.index');

    // Billing
    Route::prefix('billing')->name('resident.billing.')->group(function (): void {
        Route::get('/', [BillingController::class, 'index'])->name('index');
        Route::get('/subscription', [BillingController::class, 'subscription'])->name('subscription');
        Route::get('/payment', [BillingController::class, 'payment'])->name('payment');
        Route::get('/receipts', [BillingController::class, 'receipts'])->name('receipts');
        Route::get('/receipts/{invoice}/download', [BillingController::class, 'downloadReceipt'])->name('receipts.download')->middleware('throttle:30,1');
        Route::post('/subscribe', [BillingController::class, 'subscribe'])->name('subscribe');
        Route::post('/setup-payment', [BillingController::class, 'setupPaymentMethod'])->name('setup-payment');
        Route::post('/auto-renew/enable', [BillingController::class, 'enableAutoRenew'])->name('auto-renew.enable');
        Route::post('/auto-renew/disable', [BillingController::class, 'disableAutoRenew'])->name('auto-renew.disable');
        Route::post('/auto-renew/dismiss', [BillingController::class, 'dismissAutoRenewSuggestion'])->name('auto-renew.dismiss');
        Route::get('/payment/callback', PaymentCallbackController::class)->name('payment.callback');
        Route::get('/magic-url', [BillingController::class, 'generateMagicUrl'])->name('magic-url');
        Route::post('/validate-coupon', [BillingController::class, 'validateCoupon'])->name('coupon.validate');
    });

    // Estate Collections (Dues)
    Route::prefix('dues')->name('resident.collections.')->middleware('check-estate-feature:payment-collection')->group(function (): void {
        Route::get('/', [CollectionController::class, 'index'])->name('index');
        Route::get('/{assignment}', [CollectionController::class, 'show'])
            ->name('show')
            ->missing(function () {
                return redirect()->route('resident.collections.index')->with('error', 'This bill no longer exists.');
            });
        Route::post('/{assignment}/verify', [CollectionController::class, 'verify'])->name('verify');
    });

    // Household Management
    Route::prefix('household')->name('resident.household.')->middleware('check-estate-feature:household-management')->group(function (): void {
        Route::get('/', [HouseholdMemberController::class, 'index'])->name('index');
        Route::middleware('resident.active')->group(function (): void {
            Route::post('/', [HouseholdMemberController::class, 'store'])->name('store');
            Route::delete('/{householdMember}', [HouseholdMemberController::class, 'destroy'])->name('destroy');
        });
        Route::post('/{householdMember}/resend-invitation', [HouseholdMemberController::class, 'resendInvitation'])->name('resend-invitation');
    });
});

// ──────────────────────────────────────────────────────────────
// Property Owner routes (gated by property_owner role)
// ──────────────────────────────────────────────────────────────
Route::middleware('role:property_owner')->prefix('property-owner')->name('resident.property-owner.')->group(function (): void {
    Route::get('/dashboard', PODashboardController::class)->name('dashboard');

    // Managed Residents CRUD
    Route::patch('/residents/{resident}/suspend', [POResidentController::class, 'suspend'])->name('residents.suspend');
    Route::post('/residents/{resident}/resend-invitation', [POResidentController::class, 'resendInvitation'])->name('residents.resend-invitation');
    Route::post('/residents/invite-link', [POResidentController::class, 'storeInviteLink'])->name('residents.invite-link.store');
    Route::post('/residents/invite-link/regenerate', [POResidentController::class, 'regenerateInviteLink'])->name('residents.invite-link.regenerate');
    Route::post('/residents/invite-link/toggle', [POResidentController::class, 'toggleInviteLink'])->name('residents.invite-link.toggle');
    Route::delete('/residents/invite-link', [POResidentController::class, 'destroyInviteLink'])->name('residents.invite-link.destroy');
    Route::resource('/residents', POResidentController::class)->except(['show'])->names('residents');

    // Properties CRUD
    Route::post('/properties/{property}/assign-resident', [POPropertyController::class, 'assignResident'])->name('properties.assign-resident');
    Route::post('/properties/{property}/remove-resident', [POPropertyController::class, 'removeResident'])->name('properties.remove-resident');
    Route::resource('/properties', POPropertyController::class)->names('properties');

    // Custom Collections
    Route::post('/collections/assignments/{assignment}/record-payment', [POCollectionController::class, 'recordPayment'])->name('collections.record-payment');
    Route::resource('/collections', POCollectionController::class)->names('collections');

    // Scoped Announcements
    Route::resource('/announcements', POAnnouncementController::class)->names('announcements');

    // Settlement Account configuration
    Route::get('/settlement', [POSettlementController::class, 'index'])->name('settlement.index');
    Route::put('/settlement', [POSettlementController::class, 'update'])->name('settlement.update');
    Route::post('/settlement/resolve', [POSettlementController::class, 'resolve'])->name('settlement.resolve');
});

// Incidents: community issue tracker (accessible by resident, household_member, property_owner)
Route::middleware('role:resident,household_member,property_owner')->group(function (): void {
    Route::prefix('incidents')->name('resident.incidents.')->middleware('resident.active')->group(function () {
        Route::get('/', [IncidentController::class, 'index'])->name('index');
        Route::get('/create', [IncidentController::class, 'create'])->name('create');
        Route::match(['GET', 'POST'], '/check-deduplication', [IncidentController::class, 'checkDeduplication'])->name('check-deduplication');
        Route::post('/signed-upload', [IncidentController::class, 'signedUploadParams'])->name('signed-upload');
        Route::post('/', [IncidentController::class, 'store'])->name('store');
        Route::get('/{incident}', [IncidentController::class, 'show'])
            ->name('show')
            ->missing(function () {
                return redirect()->route('resident.incidents.index')->with('error', 'This incident no longer exists.');
            });
        Route::delete('/{incident}', [IncidentController::class, 'destroy'])->name('destroy');

        // Rate-limited comments
        Route::middleware('throttle:incident-comments')->group(function () {
            Route::post('/{incident}/comments', [IncidentCommentController::class, 'store'])->name('comments.store');
            Route::delete('/comments/{comment}', [IncidentCommentController::class, 'destroy'])->name('comments.destroy');
        });

        Route::post('/{incident}/upvote', [IncidentUpvoteController::class, 'store'])->name('upvote');
        Route::post('/{incident}/close', IncidentCloseController::class)->name('close');
    });
});
