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
        Schema::table('visitor_profiles', function (Blueprint $table) {
            // "local" means id_photo_path is a file on this server; "cloudinary" means it is a private Cloudinary public id.
            $table->string('id_photo_disk', 30)->default('local')->after('id_photo_path');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('visitor_profiles', function (Blueprint $table) {
            $table->dropColumn('id_photo_disk');
        });
    }
};
