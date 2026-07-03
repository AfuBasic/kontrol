<?php

use App\Http\Controllers\Admin\ActivityLogController;
use App\Http\Controllers\Admin\BillingController;
use App\Http\Controllers\Admin\CollectionAnalyticsController;
use App\Http\Controllers\Admin\CollectionController;
use App\Http\Controllers\Admin\DashboardController;
use App\Http\Controllers\Admin\EstateBoardCommentController;
use App\Http\Controllers\Admin\EstateBoardController;
use App\Http\Controllers\Admin\IncidentCommentController;
use App\Http\Controllers\Admin\IncidentController;
use App\Http\Controllers\Admin\IncidentStatusController;
use App\Http\Controllers\Admin\InviteLinkController;
use App\Http\Controllers\Admin\InvoiceController;
use App\Http\Controllers\Admin\NotificationController;
use App\Http\Controllers\Admin\PaymentCallbackController;
use App\Http\Controllers\Admin\PaymentHistoryController;
use App\Http\Controllers\Admin\ProfileController;
use App\Http\Controllers\Admin\PropertyOwnerController;
use App\Http\Controllers\Admin\PropertyOwnerInviteLinkController;
use App\Http\Controllers\Admin\ResidentApprovalController;
use App\Http\Controllers\Admin\ResidentController;
use App\Http\Controllers\Admin\RoleController;
use App\Http\Controllers\Admin\SecurityPersonnelController;
use App\Http\Controllers\Admin\SettingsController;
use App\Http\Controllers\Admin\SettlementController;
use App\Http\Controllers\Admin\TransactionController;
use App\Http\Controllers\Admin\UserController;
use App\Http\Controllers\Admin\VisitorLogController;
use App\Http\Controllers\Api\ContentEnhanceController;
use App\Http\Middleware\EnsureIsAdmin;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Admin Routes
|--------------------------------------------------------------------------
|
| Routes for estate administrators. All routes require authentication
| and the 'admin' role (scoped to the user's estate).
|
*/

Route::middleware(['auth', EnsureIsAdmin::class])->name('admin.')->group(function (): void {
    // Legacy dashboard redirect
    Route::get('/dashboard', DashboardController::class)->name('dashboard');

    // Estate Board
    Route::prefix('estate-board')->name('estate-board.')->middleware('feature:estate-board')->group(function (): void {
        Route::get('/', [EstateBoardController::class, 'index'])->name('index');
        Route::get('/manage', [EstateBoardController::class, 'manage'])->name('manage');
        Route::get('/create', [EstateBoardController::class, 'create'])->name('create');
        Route::post('/enhance-content', ContentEnhanceController::class)
            ->middleware('throttle:estate-board-enhance')
            ->name('enhance-content');
        Route::get('/{post}', [EstateBoardController::class, 'show'])->name('show');
        Route::get('/{post}/edit', [EstateBoardController::class, 'edit'])->name('edit');

        // Rate-limited mutation routes for posts
        Route::middleware('throttle:estate-board-posts')->group(function (): void {
            Route::post('/', [EstateBoardController::class, 'store'])->name('store');
            Route::put('/{post}', [EstateBoardController::class, 'update'])->name('update');
            Route::delete('/{post}', [EstateBoardController::class, 'destroy'])->name('destroy');
        });

        // Rate-limited comment routes
        Route::middleware(['throttle:estate-board-comments', 'feature:comment-moderation'])->group(function (): void {
            Route::post('/{post}/comments', [EstateBoardCommentController::class, 'store'])->name('comments.store');
            Route::delete('/comments/{comment}', [EstateBoardCommentController::class, 'destroy'])->name('comments.destroy');
        });
    });

    // Residents management
    Route::middleware('permission:residents.view')->group(function (): void {
        // Explicit routes must come before resource to avoid {resident} matching "bulk-delete"
        Route::middleware('feature:secure-invitations')->group(function (): void {
            Route::post('residents/bulk-invite', [ResidentController::class, 'bulkInvite'])->name('residents.bulk-invite');
            Route::get('residents/invite-link', [InviteLinkController::class, 'index'])->name('residents.invite-link.index');
            Route::post('residents/invite-link', [InviteLinkController::class, 'store'])->name('residents.invite-link.store');
            Route::post('residents/invite-link/toggle', [InviteLinkController::class, 'toggle'])->name('residents.invite-link.toggle');
            Route::post('residents/invite-link/regenerate', [InviteLinkController::class, 'regenerate'])->name('residents.invite-link.regenerate');
            Route::delete('residents/invite-link', [InviteLinkController::class, 'destroy'])->name('residents.invite-link.destroy');
        });

        Route::delete('residents/bulk-delete', [ResidentController::class, 'bulkDelete'])->name('residents.bulk-delete');
        Route::patch('residents/{resident}/suspend', [ResidentController::class, 'suspend'])->name('residents.suspend');
        Route::patch('residents/{resident}/mark-as-property-owner', [ResidentController::class, 'markAsPropertyOwner'])->name('residents.mark-as-property-owner');
        Route::post('residents/{resident}/resend-invitation', [ResidentController::class, 'resendInvitation'])->name('residents.resend-invitation');

        Route::prefix('residents/approvals')->name('residents.approvals.')->middleware('feature:approval-portal')->group(function (): void {
            Route::get('/', [ResidentApprovalController::class, 'index'])->name('index');
            Route::post('/{user}/approve', [ResidentApprovalController::class, 'approve'])->name('approve');
            Route::post('/{user}/reject', [ResidentApprovalController::class, 'reject'])->name('reject');
        });

        Route::resource('residents', ResidentController::class)->except(['show'])->middleware('feature:resident-directory');

        // Property Owners management
        Route::middleware('permission:property_owners.view')->group(function (): void {
            Route::middleware('feature:secure-invitations')->group(function (): void {
                Route::post('property-owners/bulk-invite', [PropertyOwnerController::class, 'bulkInvite'])->name('property-owners.bulk-invite');
                Route::get('property-owners/invite-link', [PropertyOwnerInviteLinkController::class, 'index'])->name('property-owners.invite-link.index');
                Route::post('property-owners/invite-link', [PropertyOwnerInviteLinkController::class, 'store'])->name('property-owners.invite-link.store');
                Route::post('property-owners/invite-link/toggle', [PropertyOwnerInviteLinkController::class, 'toggle'])->name('property-owners.invite-link.toggle');
                Route::post('property-owners/invite-link/regenerate', [PropertyOwnerInviteLinkController::class, 'regenerate'])->name('property-owners.invite-link.regenerate');
                Route::delete('property-owners/invite-link', [PropertyOwnerInviteLinkController::class, 'destroy'])->name('property-owners.invite-link.destroy');
            });

            Route::patch('property-owners/{propertyOwner}/suspend', [PropertyOwnerController::class, 'suspend'])->name('property-owners.suspend');
            Route::get('property-owners/{propertyOwner}/residents', [PropertyOwnerController::class, 'residents'])->name('property-owners.residents');
            Route::get('property-owners/{propertyOwner}/available-residents', [PropertyOwnerController::class, 'availableResidents'])->name('property-owners.available-residents');
            Route::post('property-owners/{propertyOwner}/assign-residents', [PropertyOwnerController::class, 'assignResidents'])->name('property-owners.assign-residents');
            Route::post('property-owners/{propertyOwner}/make-resident', [PropertyOwnerController::class, 'makeResident'])->name('property-owners.make-resident');
            Route::get('property-owners/{propertyOwner}/properties', [PropertyOwnerController::class, 'properties'])->name('property-owners.properties');
            Route::resource('property-owners', PropertyOwnerController::class)->except(['show']);
        });
    });

    // Visitor Logs
    Route::prefix('visitors')->name('visitors.')->group(function (): void {
        Route::get('/', [VisitorLogController::class, 'index'])->name('index');
    });

    // Security Personnel management
    Route::middleware(['permission:security.view', 'feature:security-personnel-management'])->group(function (): void {
        // Explicit routes must come before resource to avoid {security} matching "bulk-delete"
        Route::delete('security/bulk-delete', [SecurityPersonnelController::class, 'bulkDelete'])->name('security.bulk-delete');
        Route::patch('security/{security}/suspend', [SecurityPersonnelController::class, 'suspend'])->name('security.suspend');
        Route::post('security/{security}/reset-password', [SecurityPersonnelController::class, 'resetPassword'])->name('security.reset-password');
        Route::resource('security', SecurityPersonnelController::class)->except(['show']);
    });

    // Settings (admin-only)
    Route::middleware('role:admin')->group(function (): void {
        Route::get('/settings', [SettingsController::class, 'index'])->name('settings');
        Route::put('/settings', [SettingsController::class, 'update'])->name('settings.update');
        Route::get('/settings/banks', [SettingsController::class, 'banks'])->name('settings.banks');

        // Settlement Banking
        Route::prefix('settlement')->name('settlement.')->group(function (): void {
            Route::post('/resolve', [SettlementController::class, 'resolve'])->name('resolve');
            Route::post('/update', [SettlementController::class, 'update'])->name('update');
        });

        // Activity Log
        Route::get('/activity-log', [ActivityLogController::class, 'index'])->name('activity-log.index')->middleware('feature:activity-logs');
    });

    // Profile (own profile)
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile');
    Route::put('/profile', [ProfileController::class, 'update'])->name('profile.update');

    // Role management
    Route::middleware(['permission:roles.view', 'feature:user-access-control'])->group(function (): void {
        Route::resource('roles', RoleController::class)->except(['show']);
    });

    // Notifications
    Route::get('/notifications', [NotificationController::class, 'index'])->name('notifications.index');
    Route::patch('/notifications/{id}/read', [NotificationController::class, 'markAsRead'])->name('notifications.read');
    Route::post('/notifications/read-all', [NotificationController::class, 'markAllAsRead'])->name('notifications.read-all');
    Route::post('/notifications/clear-all', [NotificationController::class, 'clearAll'])->name('notifications.clear-all');

    // Admin User management (manage other admins)
    Route::middleware('role:admin')->group(function (): void {
        Route::resource('users', UserController::class)->except(['show']);
    });

    // Billing (gated by charge_type === 'estate' in controllers)
    Route::prefix('billing')->name('billing.')->group(function (): void {
        Route::get('/', BillingController::class)->name('index');
        Route::patch('/preference', [BillingController::class, 'updatePreference'])->name('preference.update');
        Route::get('/invoice', [InvoiceController::class, 'showPending'])->name('invoice.pending')->middleware('feature:automated-invoicing');
        Route::get('/invoices', [InvoiceController::class, 'index'])->name('invoices.index')->middleware('feature:automated-invoicing');
        Route::get('/invoices/{invoice}', [InvoiceController::class, 'show'])->name('invoices.show')->middleware('feature:automated-invoicing');
        Route::post('/invoices/{invoice}/pay', [InvoiceController::class, 'pay'])->name('invoices.pay')->middleware('feature:payment-collection');
        Route::post('/invoices/{invoice}/confirm-payment', [InvoiceController::class, 'confirmPayment'])->name('invoices.confirm-payment')->middleware('feature:payment-collection');
        Route::post('/invoices/{invoice}/send', [InvoiceController::class, 'sendInvoice'])->name('invoices.send')->middleware('feature:automated-invoicing');
        Route::get('/history', [PaymentHistoryController::class, 'index'])->name('history')->middleware('feature:financial-audit');
        Route::get('/payment/callback', PaymentCallbackController::class)->name('payment.callback');
    });

    // Estate Transactions (Financial Ledger)
    Route::prefix('transactions')->name('transactions.')->middleware(['feature:payment-collection', 'permission:transactions.view'])->group(function (): void {
        Route::get('/', [TransactionController::class, 'index'])->name('index');
        Route::get('/export', [TransactionController::class, 'export'])->middleware('permission:transactions.export')->name('export');
        Route::get('/{transaction}', [TransactionController::class, 'show'])->name('show');
        Route::post('/offline-payment', [TransactionController::class, 'recordOfflinePayment'])->middleware('permission:transactions.record_offline_payment')->name('offline-payment');
        Route::post('/{transaction}/refund', [TransactionController::class, 'issueRefund'])->middleware('permission:transactions.refund')->name('refund');
        Route::post('/{transaction}/adjustment', [TransactionController::class, 'createAdjustment'])->middleware('permission:transactions.adjust')->name('adjustment');
    });

    // Collections (Resident dues management)
    Route::prefix('collections')->name('collections.')->middleware('feature:payment-collection')->group(function (): void {
        Route::get('/', [CollectionController::class, 'index'])->name('index');
        Route::get('/analytics', [CollectionAnalyticsController::class, 'index'])->name('analytics');
        Route::get('/create', [CollectionController::class, 'create'])->name('create');
        Route::post('/', [CollectionController::class, 'store'])->name('store');
        Route::get('/{collection}', [CollectionController::class, 'show'])->name('show');
        Route::get('/{collection}/edit', [CollectionController::class, 'edit'])->name('edit');
        Route::put('/{collection}', [CollectionController::class, 'update'])->name('update');
        Route::post('/{collection}/publish', [CollectionController::class, 'publish'])->name('publish');
        Route::post('/{collection}/remind', [CollectionController::class, 'remind'])->name('remind');
        Route::get('/{collection}/export', [CollectionController::class, 'export'])->name('export');
        Route::post('/assignments/{assignment}/record-payment', [CollectionController::class, 'recordPayment'])->name('assignments.record-payment');
        Route::delete('/{collection}', [CollectionController::class, 'destroy'])->name('destroy');
    });

    // Incidents management
    Route::prefix('incidents')->name('incidents.')->group(function () {
        Route::get('/', [IncidentController::class, 'index'])->name('index');
        Route::get('/{incident}', [IncidentController::class, 'show'])->name('show');
        Route::delete('/{incident}', [IncidentController::class, 'destroy'])->name('destroy');
        Route::put('/{incident}/status', [IncidentStatusController::class, 'update'])->name('status.update');

        Route::post('/{incident}/comments', [IncidentCommentController::class, 'store'])->name('comments.store');
        Route::delete('/comments/{comment}', [IncidentCommentController::class, 'destroy'])->name('comments.destroy');
    });
});
