<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('estate_organizations', function (Blueprint $table) {
            $table->dropColumn(['operating_hours', 'hours_enforcement']);
        });
    }

    public function down(): void
    {
        Schema::table('estate_organizations', function (Blueprint $table) {
            $table->json('operating_hours')->nullable()->after('notes');
            $table->string('hours_enforcement')->default('inherit')->after('operating_hours');
        });
    }
};
