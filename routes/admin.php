<?php

use App\Http\Controllers\Admin\ActivityLogController;
use App\Http\Controllers\Admin\BillingController;
use App\Http\Controllers\Admin\CollectionController;
use App\Http\Controllers\Admin\DashboardController;
use App\Http\Controllers\Admin\EstateBoardCommentController;
use App\Http\Controllers\Admin\EstateBoardController;
use App\Http\Controllers\Admin\InviteLinkController;
use App\Http\Controllers\Admin\InvoiceController;
use App\Http\Controllers\Admin\NotificationController;
use App\Http\Controllers\Admin\PaymentCallbackController;
use App\Http\Controllers\Admin\PaymentHistoryController;
use App\Http\Controllers\Admin\ProfileController;
use App\Http\Controllers\Admin\ResidentApprovalController;
use App\Http\Controllers\Admin\ResidentController;
use App\Http\Controllers\Admin\RoleController;
use App\Http\Controllers\Admin\SecurityPersonnelController;
use App\Http\Controllers\Admin\SettingsController;
use App\Http\Controllers\Admin\UserController;
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
        Route::post('/enhance-content', ContentEnhanceController::class)->name('enhance-content');
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
        Route::post('residents/{resident}/reset-password', [ResidentController::class, 'resetPassword'])->name('residents.reset-password');

        Route::prefix('residents/approvals')->name('residents.approvals.')->middleware('feature:approval-portal')->group(function (): void {
            Route::get('/', [ResidentApprovalController::class, 'index'])->name('index');
            Route::post('/{user}/approve', [ResidentApprovalController::class, 'approve'])->name('approve');
            Route::post('/{user}/reject', [ResidentApprovalController::class, 'reject'])->name('reject');
        });

        Route::resource('residents', ResidentController::class)->except(['show'])->middleware('feature:resident-directory');
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

    // Collections (Resident dues management)
    Route::prefix('collections')->name('collections.')->middleware('feature:payment-collection')->group(function (): void {
        Route::get('/', [CollectionController::class, 'index'])->name('index');
        Route::get('/create', [CollectionController::class, 'create'])->name('create');
        Route::post('/', [CollectionController::class, 'store'])->name('store');
        Route::get('/{collection}', [CollectionController::class, 'show'])->name('show');
        Route::get('/{collection}/edit', [CollectionController::class, 'edit'])->name('edit');
        Route::put('/{collection}', [CollectionController::class, 'update'])->name('update');
        Route::post('/{collection}/publish', [CollectionController::class, 'publish'])->name('publish');
        Route::post('/{collection}/remind', [CollectionController::class, 'remind'])->name('remind');
        Route::get('/{collection}/export', [CollectionController::class, 'export'])->name('export');
        Route::delete('/{collection}', [CollectionController::class, 'destroy'])->name('destroy');
    });
});
