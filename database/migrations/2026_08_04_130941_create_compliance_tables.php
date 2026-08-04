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
        // 1. Policies Table
        Schema::create('compliance_policies', function (Blueprint $table) {
            $table->id();
            $table->foreignId('estate_id')->nullable()->constrained('estates')->cascadeOnDelete();
            $table->string('violation_type'); // e.g. collection_overdue, vehicle_registration_expired
            $table->string('name');
            $table->text('description')->nullable();
            $table->boolean('is_active')->default(true);
            $table->json('payment_plan_policy')->nullable(); // { "pause_penalties": true, "suspend_restrictions": true, "suspend_escalation": true }
            $table->timestamps();

            $table->index(['estate_id', 'violation_type']);
        });

        // 2. Policy Stages Table
        Schema::create('policy_stages', function (Blueprint $table) {
            $table->id();
            $table->foreignId('compliance_policy_id')->constrained('compliance_policies')->cascadeOnDelete();
            $table->string('stage_name'); // e.g. reminder, warning, penalty, restriction, escalation
            $table->integer('trigger_days')->default(0); // days past due / since violation
            $table->integer('order')->default(1);
            $table->integer('grace_period_days')->default(0);
            $table->timestamps();

            $table->index(['compliance_policy_id', 'order']);
        });

        // 3. Policy Actions Table
        Schema::create('policy_actions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('policy_stage_id')->constrained('policy_stages')->cascadeOnDelete();
            $table->string('action_type'); // notification, penalty, restriction, escalation, assign_officer
            $table->json('configuration')->nullable(); // driver configuration payload
            $table->boolean('is_enabled')->default(true);
            $table->timestamps();
        });

        // 4. Compliance Violations Table
        Schema::create('compliance_violations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('estate_id')->constrained('estates')->cascadeOnDelete();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('property_id')->nullable()->constrained('properties')->nullOnDelete();
            $table->foreignId('compliance_policy_id')->nullable()->constrained('compliance_policies')->nullOnDelete();
            $table->foreignId('current_stage_id')->nullable()->constrained('policy_stages')->nullOnDelete();
            $table->nullableMorphs('violatable'); // e.g. App\Models\CollectionAssignment
            $table->string('violation_type');
            $table->string('status')->default('open'); // open, under_restriction, escalated, on_payment_plan, resolved, dismissed
            $table->timestamp('due_at')->nullable();
            $table->decimal('original_amount', 12, 2)->default(0);
            $table->decimal('outstanding_amount', 12, 2)->default(0);
            $table->decimal('total_penalties_applied', 12, 2)->default(0);
            $table->timestamp('resolved_at')->nullable();
            $table->string('resolution_reason')->nullable();
            $table->timestamps();

            $table->index(['estate_id', 'status']);
            $table->index(['user_id', 'status']);
            $table->index('violation_type');
        });

        // 5. Compliance Restrictions Table
        Schema::create('compliance_restrictions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('violation_id')->constrained('compliance_violations')->cascadeOnDelete();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('estate_id')->constrained('estates')->cascadeOnDelete();
            $table->string('feature_key'); // e.g. amenity.book, hall.reserve, club.access (NOTE: visitor_pass.create is excluded)
            $table->string('status')->default('active'); // active, suspended_by_payment_plan, lifted
            $table->timestamp('restricted_at')->useCurrent();
            $table->timestamp('lifted_at')->nullable();
            $table->string('lift_reason')->nullable();
            $table->timestamps();

            $table->index(['user_id', 'feature_key', 'status']);
            $table->index(['estate_id', 'status']);
        });

        // 6. Penalty Records Table
        Schema::create('compliance_penalty_records', function (Blueprint $table) {
            $table->id();
            $table->foreignId('violation_id')->constrained('compliance_violations')->cascadeOnDelete();
            $table->foreignId('policy_action_id')->nullable()->constrained('policy_actions')->nullOnDelete();
            $table->string('penalty_type'); // fixed, percentage, daily_interest, weekly_interest, monthly_interest
            $table->decimal('amount', 12, 2);
            $table->json('calculation_details')->nullable();
            $table->timestamp('applied_at')->useCurrent();
            $table->timestamps();
        });

        // 7. Payment Plans Table
        Schema::create('compliance_payment_plans', function (Blueprint $table) {
            $table->id();
            $table->foreignId('violation_id')->constrained('compliance_violations')->cascadeOnDelete();
            $table->foreignId('approved_by_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('status')->default('active'); // active, completed, defaulted, cancelled
            $table->decimal('installment_amount', 12, 2);
            $table->string('frequency')->default('monthly'); // weekly, biweekly, monthly
            $table->date('start_date');
            $table->date('next_due_date');
            $table->json('terms')->nullable();
            $table->timestamps();
        });

        // 8. Timelines Table
        Schema::create('compliance_timelines', function (Blueprint $table) {
            $table->id();
            $table->foreignId('violation_id')->constrained('compliance_violations')->cascadeOnDelete();
            $table->string('event_type'); // violation_created, stage_entered, notification_sent, penalty_applied, restriction_imposed, restriction_lifted, payment_plan_created, escalated, resolved
            $table->string('title');
            $table->text('description')->nullable();
            $table->json('metadata')->nullable();
            $table->string('actor_type')->nullable(); // system, user, admin
            $table->unsignedBigInteger('actor_id')->nullable();
            $table->timestamp('created_at')->useCurrent();

            $table->index(['violation_id', 'created_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('compliance_timelines');
        Schema::dropIfExists('compliance_payment_plans');
        Schema::dropIfExists('compliance_penalty_records');
        Schema::dropIfExists('compliance_restrictions');
        Schema::dropIfExists('compliance_violations');
        Schema::dropIfExists('policy_actions');
        Schema::dropIfExists('policy_stages');
        Schema::dropIfExists('compliance_policies');
    }
};
