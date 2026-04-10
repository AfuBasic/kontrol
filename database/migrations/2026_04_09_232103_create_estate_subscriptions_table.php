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
        Schema::create('estate_subscriptions', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('estate_id')->unique()->constrained('estates')->onDelete('cascade');
            $table->foreignId('plan_id')->constrained('plans')->onDelete('restrict');
            $table->enum('status', ['trial', 'active', 'past_due', 'cancelled'])->default('trial');
            $table->enum('billing_interval', ['monthly', 'annual'])->default('monthly');
            $table->timestamp('trial_ends_at')->nullable();
            $table->timestamp('current_period_end')->nullable();
            $table->unsignedBigInteger('overridden_by')->nullable()->comment('Zeus admin ID who overrode the plan');
            $table->text('override_notes')->nullable();
            $table->timestamps();
            $table->index('status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('estate_subscriptions');
    }
};
