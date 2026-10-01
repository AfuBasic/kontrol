<?php

use App\Http\Controllers\Organization\AccessMemberController;
use App\Http\Controllers\Organization\AnnouncementController;
use App\Http\Controllers\Organization\ArrivalController;
use App\Http\Controllers\Organization\ContextController;
use App\Http\Controllers\Organization\CredentialController;
use App\Http\Controllers\Organization\DashboardController;
use App\Http\Controllers\Organization\NotificationController;
use App\Http\Controllers\Organization\OrganizationBulkInviteController;
use App\Http\Controllers\Organization\OrganizationVisitorController;
use App\Http\Controllers\Organization\PaymentController;
use App\Http\Controllers\Organization\PublicWindowController;
use App\Http\Controllers\Organization\SettingsController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth', 'org.membership'])->prefix('org')->name('org.')->group(function () {
    // 1. Home
    Route::get('/', [DashboardController::class, 'index'])->name('dashboard');

    // Context switching
    Route::post('/switch/{organization}', [ContextController::class, 'switchOrganization'])->name('context.switch');

    // 2. Access Hub: People (Access List)
    Route::prefix('access-list')->name('access-list.')->group(function () {
        Route::get('/', [AccessMemberController::class, 'index'])->name('index');
        Route::patch('/{member}', [AccessMemberController::class, 'update'])->name('update');
        Route::post('/{member}/suspend', [AccessMemberController::class, 'suspend'])->name('suspend');
        Route::post('/{member}/activate', [AccessMemberController::class, 'activate'])->name('activate');
        Route::delete('/{member}', [AccessMemberController::class, 'destroy'])->name('destroy');

        // Requires active subscription
        Route::post('/', [AccessMemberController::class, 'store'])->name('store')->middleware('resident.active:force');
    });

    // Access: Credentials (issue/renew/revoke actions)
    Route::prefix('credentials')->name('credentials.')->group(function () {
        Route::get('/', [CredentialController::class, 'index'])->name('index');
        Route::post('/issue/{member}', [CredentialController::class, 'issue'])->name('issue');
        Route::post('/{credential}/renew', [CredentialController::class, 'renew'])->name('renew');
        Route::post('/{credential}/revoke', [CredentialController::class, 'revoke'])->name('revoke');
    });

    // Access: On-site (visitors currently present, only when checkout tracking is enabled)
    Route::prefix('on-site')->name('on-site.')->group(function () {
        Route::get('/', [ArrivalController::class, 'index'])->name('index');
        Route::get('/history', [ArrivalController::class, 'history'])->name('history');
        Route::post('/{log}/confirm', [ArrivalController::class, 'confirm'])->name('confirm');
    });

    // Access: Visitors (Temporary passes)
    Route::prefix('visitors')->name('visitors.')->group(function () {
        Route::get('/', [OrganizationVisitorController::class, 'index'])->name('index');
        Route::delete('/{pass}', [OrganizationVisitorController::class, 'destroy'])->name('destroy');

        // Requires active subscription
        Route::middleware('resident.active:force')->group(function () {
            Route::post('/', [OrganizationVisitorController::class, 'store'])->name('store');
            Route::post('/bulk', [OrganizationBulkInviteController::class, 'store'])->name('storeBulk');
            Route::post('/{pass}/extend', [OrganizationVisitorController::class, 'extend'])->name('extend');
        });
    });

    // Access: Bulk Visitor Invites
    Route::prefix('bulk-invites')->name('bulk-invites.')->group(function () {
        Route::get('/', [OrganizationBulkInviteController::class, 'index'])->name('index');
        Route::get('/{bulkInvite}', [OrganizationBulkInviteController::class, 'show'])->name('show');
        Route::get('/{bulkInvite}/delivery-status', [OrganizationBulkInviteController::class, 'deliveryStatus'])->name('delivery-status');
        Route::post('/{bulkInvite}/retry-failed', [OrganizationBulkInviteController::class, 'retryFailed'])->name('retry-failed');
        Route::post('/{bulkInvite}/cancel', [OrganizationBulkInviteController::class, 'cancel'])->name('cancel');
        Route::delete('/{bulkInvite}/recipients/{recipient}', [OrganizationBulkInviteController::class, 'removeRecipient'])->name('recipients.destroy');
        Route::post('/{bulkInvite}/recipients/{recipient}/resend', [OrganizationBulkInviteController::class, 'resendRecipient'])->name('recipients.resend');
        Route::get('/{bulkInvite}/recipients/{recipient}/visits', [OrganizationBulkInviteController::class, 'recipientVisits'])->name('recipients.visits');
        Route::get('/{bulkInvite}/recipients/{recipient}/qr', [OrganizationBulkInviteController::class, 'recipientQr'])->name('recipients.qr');

        // Requires active subscription
        Route::middleware('resident.active:force')->group(function () {
            Route::post('/', [OrganizationBulkInviteController::class, 'store'])->name('store');
            Route::post('/{bulkInvite}/renew', [OrganizationBulkInviteController::class, 'renew'])->name('renew');
        });
    });

    // Access: Public Access Windows (for Public Window policies e.g. Churches)
    Route::prefix('public-windows')->name('public-windows.')->group(function () {
        Route::get('/', [PublicWindowController::class, 'index'])->name('index');
        Route::post('/', [PublicWindowController::class, 'store'])->name('store');
        Route::patch('/{window}', [PublicWindowController::class, 'update'])->name('update');
        Route::delete('/{window}', [PublicWindowController::class, 'destroy'])->name('destroy');
    });

    // 3. Payments
    Route::get('/payments', [PaymentController::class, 'index'])->name('payments.index');

    // 4. Announcements & Discussions
    Route::prefix('announcements')->name('announcements.')->group(function () {
        Route::get('/', [AnnouncementController::class, 'index'])->name('index');
        Route::get('/{post}', [AnnouncementController::class, 'show'])->name('show');
        Route::post('/{post}/comments', [AnnouncementController::class, 'storeComment'])->name('comments.store');
    });

    // 5. Notifications
    Route::prefix('notifications')->name('notifications.')->group(function () {
        Route::get('/', [NotificationController::class, 'index'])->name('index');
        Route::post('/{id}/read', [NotificationController::class, 'markAsRead'])->name('read');
        Route::post('/read-all', [NotificationController::class, 'markAllAsRead'])->name('read-all');
        Route::post('/clear-all', [NotificationController::class, 'clearAll'])->name('clear-all');
    });

    // 6. Profile & Settings (Team & Preferences)
    Route::prefix('settings')->name('settings.')->group(function () {
        Route::get('/', [SettingsController::class, 'index'])->name('index');
        Route::patch('/confirmation-policy', [SettingsController::class, 'updateConfirmationPolicy'])->name('confirmation-policy.update');
        Route::post('/staff', [SettingsController::class, 'inviteStaff'])->name('staff.invite');
        Route::delete('/staff/{targetMembership}', [SettingsController::class, 'removeStaff'])->name('staff.remove');
    });
});
