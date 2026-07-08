<?php

use App\Enums\CommissionStatus;
use App\Enums\PartnerStatus;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('estates', function (Blueprint $table) {
            $table->string('partner_source')->nullable()->after('referrer_id');
            $table->foreignId('commission_plan_id')->nullable()->after('partner_source')->constrained('commission_plans')->nullOnDelete();
            $table->date('commission_starts_at')->nullable()->after('commission_plan_id');
            $table->date('commission_ends_at')->nullable()->after('commission_starts_at');
            $table->date('partner_date')->nullable()->after('commission_ends_at');
            $table->date('activation_date')->nullable()->after('partner_date');
            $table->enum('partner_status', array_column(PartnerStatus::cases(), 'value'))->nullable()->after('activation_date');
            $table->enum('commission_status', array_column(CommissionStatus::cases(), 'value'))->default(CommissionStatus::Inactive->value)->after('partner_status');
            $table->text('partner_notes')->nullable()->after('commission_status');

            $table->index('partner_status');
        });
    }

    public function down(): void
    {
        Schema::table('estates', function (Blueprint $table) {
            $table->dropForeign(['commission_plan_id']);
            $table->dropIndex(['partner_status']);
            $table->dropColumn([
                'partner_source',
                'commission_plan_id',
                'commission_starts_at',
                'commission_ends_at',
                'partner_date',
                'activation_date',
                'partner_status',
                'commission_status',
                'partner_notes',
            ]);
        });
    }
};
