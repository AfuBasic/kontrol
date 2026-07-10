<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('partner_earnings', function (Blueprint $table) {
            $table->string('payment_reference')->nullable()->after('settled_at');
            $table->text('payment_note')->nullable()->after('payment_reference');
            $table->foreignId('settled_by_user_id')
                ->nullable()
                ->after('payment_note')
                ->constrained('users')
                ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('partner_earnings', function (Blueprint $table) {
            $table->dropConstrainedForeignId('settled_by_user_id');
            $table->dropColumn(['payment_reference', 'payment_note']);
        });
    }
};
