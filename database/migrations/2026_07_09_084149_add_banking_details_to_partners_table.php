<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('partners', function (Blueprint $table) {
            $table->string('bank_name')->nullable()->after('notes');
            $table->string('bank_code')->nullable()->after('bank_name');
            $table->string('account_number', 10)->nullable()->after('bank_code');
            $table->string('account_name')->nullable()->after('account_number');
            $table->timestamp('account_verified_at')->nullable()->after('account_name');
        });
    }

    public function down(): void
    {
        Schema::table('partners', function (Blueprint $table) {
            $table->dropColumn([
                'bank_name',
                'bank_code',
                'account_number',
                'account_name',
                'account_verified_at',
            ]);
        });
    }
};
