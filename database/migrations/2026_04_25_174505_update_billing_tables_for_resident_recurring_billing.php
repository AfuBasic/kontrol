<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Update estate_subscriptions
        Schema::table('estate_subscriptions', function (Blueprint $table) {
            $table->enum('billing_preference', ['auto', 'manual'])->default('auto')->after('status');
            $table->string('paystack_authorization_code')->nullable()->after('billing_preference');
            $table->string('paystack_customer_code')->nullable()->after('paystack_authorization_code');
            $table->string('card_brand')->nullable()->after('paystack_customer_code');
            $table->string('card_last4')->nullable()->after('card_brand');
        });

        // Update resident_subscriptions
        Schema::table('resident_subscriptions', function (Blueprint $table) {
            $table->enum('billing_preference', ['auto', 'manual'])->default('auto')->after('status');
            $table->string('paystack_authorization_code')->nullable()->after('billing_preference');
            $table->string('paystack_customer_code')->nullable()->after('paystack_authorization_code');
            $table->string('card_brand')->nullable()->after('paystack_customer_code');
            $table->string('card_last4')->nullable()->after('card_brand');
        });

        // Update invoices
        Schema::table('invoices', function (Blueprint $table) {
            $table->foreignId('user_id')->nullable()->after('estate_id')->constrained()->onDelete('cascade');
            $table->foreignId('estate_subscription_id')->nullable()->after('plan_id')->constrained('estate_subscriptions')->onDelete('set null');
        });

        // Update payment_transactions
        Schema::table('payment_transactions', function (Blueprint $table) {
            $table->string('provider')->default('paystack')->after('paystack_reference');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('payment_transactions', function (Blueprint $table) {
            $table->dropColumn('provider');
        });

        Schema::table('invoices', function (Blueprint $table) {
            $table->dropConstrainedForeignId('user_id');
            $table->dropConstrainedForeignId('estate_subscription_id');
        });

        Schema::table('resident_subscriptions', function (Blueprint $table) {
            $table->dropColumn(['billing_preference', 'paystack_authorization_code', 'paystack_customer_code', 'card_brand', 'card_last4']);
        });

        Schema::table('estate_subscriptions', function (Blueprint $table) {
            $table->dropColumn(['billing_preference', 'paystack_authorization_code', 'paystack_customer_code', 'card_brand', 'card_last4']);
        });
    }
};
