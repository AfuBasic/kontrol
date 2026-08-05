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
        Schema::table('estate_settings', function (Blueprint $table) {
            // Visitor Access
            $table->boolean('require_vehicle_information')->default(false)->after('visitor_checkout_enabled');
            $table->boolean('allow_residents_to_extend_visitor_passes')->default(false)->after('require_vehicle_information');

            // Security Operations
            $table->json('incident_categories')->nullable()->after('allow_residents_to_extend_visitor_passes');
            $table->string('default_incident_severity')->default('Low')->after('incident_categories');
            $table->boolean('require_photo_evidence_for_incidents')->default(false)->after('default_incident_severity');
            $table->boolean('require_resolution_notes_for_incidents')->default(false)->after('require_photo_evidence_for_incidents');
            $table->boolean('allow_residents_to_report_incidents')->default(true)->after('require_resolution_notes_for_incidents');
            $table->boolean('notify_admins_immediately_for_critical_incidents')->default(true)->after('allow_residents_to_report_incidents');

            // Collections & Billing
            $table->boolean('allow_partial_payments')->default(false)->after('notify_admins_immediately_for_critical_incidents');
            $table->unsignedBigInteger('minimum_partial_payment_amount')->default(0)->after('allow_partial_payments');
            $table->unsignedInteger('minimum_partial_payment_percentage')->default(0)->after('minimum_partial_payment_amount');
            $table->string('collection_reminder_frequency')->default('weekly')->after('minimum_partial_payment_percentage');
            $table->unsignedInteger('collection_maximum_reminder_attempts')->default(3)->after('collection_reminder_frequency');
            $table->unsignedInteger('send_reminder_before_due_date_days')->default(1)->after('collection_maximum_reminder_attempts');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('estate_settings', function (Blueprint $table) {
            $table->dropColumn([
                'require_vehicle_information',
                'allow_residents_to_extend_visitor_passes',
                'incident_categories',
                'default_incident_severity',
                'require_photo_evidence_for_incidents',
                'require_resolution_notes_for_incidents',
                'allow_residents_to_report_incidents',
                'notify_admins_immediately_for_critical_incidents',
                'allow_partial_payments',
                'minimum_partial_payment_amount',
                'minimum_partial_payment_percentage',
                'collection_reminder_frequency',
                'collection_maximum_reminder_attempts',
                'send_reminder_before_due_date_days',
            ]);
        });
    }
};
