<?php

use App\Http\Controllers\Zeus\ApplicationController;
use App\Http\Controllers\Zeus\AuthController;
use App\Http\Controllers\Zeus\CollectionOversightController;
use App\Http\Controllers\Zeus\CouponController;
use App\Http\Controllers\Zeus\DashboardController;
use App\Http\Controllers\Zeus\EstateController;
use App\Http\Controllers\Zeus\FeatureController;
use App\Http\Controllers\Zeus\MoneyFlowController;
use App\Http\Controllers\Zeus\NotificationController;
use App\Http\Controllers\Zeus\PartnerController;
use App\Http\Controllers\Zeus\PartnerEarningsController;
use App\Http\Controllers\Zeus\PartnerRequestController;
use App\Http\Controllers\Zeus\PlanController;
use App\Http\Controllers\Zeus\RevenueController;
use App\Http\Controllers\Zeus\RiskCenterController;
use App\Http\Controllers\Zeus\SettingsController;
use App\Http\Controllers\Zeus\SubscriptionController;
use App\Http\Controllers\Zeus\TransactionController;
use App\Http\Middleware\Zeus\EnsureZeusAuthenticated;
use App\Http\Middleware\Zeus\RedirectIfZeusAuthenticated;
use Illuminate\Support\Facades\Route;

Route::prefix('zeus')->name('zeus.')->group(function (): void {
    // Guest routes (redirect to dashboard if already authenticated)
    Route::middleware(RedirectIfZeusAuthenticated::class)->group(function (): void {
        Route::get('/', [AuthController::class, 'showLogin'])->name('login');
        Route::post('/', [AuthController::class, 'login'])->name('login.submit');
        Route::get('/login/2fa', [AuthController::class, 'showLogin2FA'])->name('login.two_factor');
        Route::post('/login/2fa', [AuthController::class, 'login2FASubmit'])->name('login.two_factor.submit');
    });

    // Authenticated routes
    Route::middleware(EnsureZeusAuthenticated::class)->group(function (): void {
        Route::get('/dashboard', DashboardController::class)->name('dashboard');
        Route::get('/revenue', RevenueController::class)->name('revenue');
        Route::get('/money-flow', MoneyFlowController::class)->name('money-flow');
        Route::get('/subscriptions', [SubscriptionController::class, 'index'])->name('subscriptions.index');
        Route::get('/collections', [CollectionOversightController::class, 'index'])->name('collections.index');
        Route::get('/collections/{collection}', [CollectionOversightController::class, 'show'])->name('collections.show');
        Route::get('/risk-center', [RiskCenterController::class, 'index'])->name('risk-center');
        Route::post('/logout', [AuthController::class, 'logout'])->name('logout');

        // Settings / 2FA Configuration
        Route::get('/settings', [SettingsController::class, 'index'])->name('settings.index');
        Route::post('/settings/2fa/enable', [SettingsController::class, 'enable'])->name('settings.two_factor.enable');
        Route::post('/settings/2fa/disable', [SettingsController::class, 'disable'])->name('settings.two_factor.disable');

        // Plans management
        Route::resource('plans', PlanController::class)->except(['show']);

        // Coupons management
        Route::get('/coupons/search-residents', [CouponController::class, 'searchResidents'])->name('coupons.search-residents');
        Route::resource('coupons', CouponController::class)->only(['index', 'show', 'create', 'store', 'destroy']);

        // Features management
        Route::get('/features', [FeatureController::class, 'index'])->name('features.index');
        Route::patch('/plans/{plan}/features/{feature}', [FeatureController::class, 'toggle'])->name('features.toggle');

        // Global Transactions
        Route::get('/transactions', [TransactionController::class, 'index'])->name('transactions.index');

        // Billing configuration
        Route::get('/billing', fn () => inertia('zeus/billing/index'))->name('billing.index');

        // Partners management
        Route::resource('partners', PartnerController::class);
        Route::post('/partners/{partner}/regenerate-key', [PartnerController::class, 'regenerateKey'])->name('partners.regenerate-key');
        Route::post('/partners/{partner}/invite-member', [PartnerController::class, 'inviteMember'])->name('partners.invite-member');
        Route::post('/partners/{partner}/members/{user}/resend-invite', [PartnerController::class, 'resendInvitation'])
            ->middleware('throttle:3,1')
            ->name('partners.members.resend-invite');

        // Partner earnings
        Route::get('/partners/{partner}/earnings', [PartnerEarningsController::class, 'index'])->name('partners.earnings.index');
        Route::post('/partners/{partner}/earnings/settle', [PartnerEarningsController::class, 'settle'])->name('partners.earnings.settle');

        // Estate management
        Route::resource('estates', EstateController::class)->only(['index', 'show', 'create', 'store', 'edit', 'update', 'destroy']);
        Route::post('/estates/{estate}/toggle-status', [EstateController::class, 'toggleStatus'])->name('estates.toggle-status');
        Route::post('/estates/{estate}/reset-password', [EstateController::class, 'resetPassword'])->name('estates.reset-password');
        Route::patch('/estates/{estate}/partner-assignment', [EstateController::class, 'updatePartnerAssignment'])->name('estates.partner-assignment.update');

        // Partner requests
        Route::get('/partner-requests', [PartnerRequestController::class, 'index'])->name('partner-requests.index');
        Route::post('/partner-requests/{partnerRequest}/approve', [PartnerRequestController::class, 'approve'])->name('partner-requests.approve');
        Route::post('/partner-requests/{partnerRequest}/reject', [PartnerRequestController::class, 'reject'])->name('partner-requests.reject');
        Route::post('/partner-requests/{partnerRequest}/request-info', [PartnerRequestController::class, 'requestInfo'])->name('partner-requests.request-info');
        Route::delete('/partner-requests/{partnerRequest}', [PartnerRequestController::class, 'destroy'])
            ->withTrashed()
            ->name('partner-requests.destroy');

        // Zeus notifications inbox
        Route::get('/notifications', [NotificationController::class, 'index'])->name('notifications.index');
        Route::post('/notifications/{notification}/read', [NotificationController::class, 'markAsRead'])->name('notifications.read');
        Route::post('/notifications/read-all', [NotificationController::class, 'markAllAsRead'])->name('notifications.read-all');
        Route::delete('/notifications/{notification}', [NotificationController::class, 'destroy'])->name('notifications.destroy');
        Route::post('/notifications/clear-all', [NotificationController::class, 'clearAll'])->name('notifications.clear-all');

        // Application management
        Route::get('/applications', [ApplicationController::class, 'index'])->name('applications.index');
        Route::get('/applications/{application}', [ApplicationController::class, 'show'])->name('applications.show');
        Route::patch('/applications/{application}/status', [ApplicationController::class, 'updateStatus'])->name('applications.status.update');
        Route::post('/applications/{application}/notes', [ApplicationController::class, 'addNote'])->name('applications.notes.store');
        Route::post('/applications/{application}/approve', [ApplicationController::class, 'approve'])->name('applications.approve');
        Route::post('/applications/{application}/reject', [ApplicationController::class, 'reject'])->name('applications.reject');
        Route::post('/applications/{application}/contacted', [ApplicationController::class, 'markContacted'])->name('applications.contacted');
    });
});
