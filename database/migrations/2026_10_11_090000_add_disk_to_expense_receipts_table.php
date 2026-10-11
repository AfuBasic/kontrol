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
        Schema::table('expense_receipts', function (Blueprint $table) {
            // Where each receipt lives, so older receipts keep working when the default disk changes.
            $table->string('disk', 30)->default('local')->after('path');
            // Cloudinary only: "image" or "raw" (PDFs), needed to build the signed link.
            $table->string('resource_type', 10)->nullable()->after('disk');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('expense_receipts', function (Blueprint $table) {
            $table->dropColumn(['disk', 'resource_type']);
        });
    }
};
