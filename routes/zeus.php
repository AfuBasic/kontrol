<?php

use App\Http\Controllers\Zeus\ApplicationController;
use App\Http\Controllers\Zeus\AuthController;
use App\Http\Controllers\Zeus\CollectionOversightController;
use App\Http\Controllers\Zeus\CouponController;
use App\Http\Controllers\Zeus\DashboardController;
use App\Http\Controllers\Zeus\EstateController;
use App\Http\Controllers\Zeus\FeatureController;
use App\Http\Controllers\Zeus\MoneyFlowController;
use App\Http\Controllers\Zeus\PlanController;
use App\Http\Controllers\Zeus\ReferrerController;
use App\Http\Controllers\Zeus\RevenueController;
use App\Http\Controllers\Zeus\RiskCenterController;
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

        // Referrers management
        Route::resource('referrers', ReferrerController::class);
        Route::post('/referrers/{referrer}/regenerate-key', [ReferrerController::class, 'regenerateKey'])->name('referrers.regenerate-key');
        Route::post('/referrers/{referrer}/invite-member', [ReferrerController::class, 'inviteMember'])->name('referrers.invite-member');

        // Estate management
        Route::resource('estates', EstateController::class)->only(['index', 'show', 'create', 'store', 'edit', 'update', 'destroy']);
        Route::post('/estates/{estate}/toggle-status', [EstateController::class, 'toggleStatus'])->name('estates.toggle-status');
        Route::post('/estates/{estate}/reset-password', [EstateController::class, 'resetPassword'])->name('estates.reset-password');

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
