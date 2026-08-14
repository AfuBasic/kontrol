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
        Schema::create('zones', function (Blueprint $table) {
            $table->id();
            $table->foreignId('estate_id')->constrained('estates')->cascadeOnDelete();
            $table->string('name');
            $table->text('description')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->softDeletes();

            $table->unique(['estate_id', 'name'], 'zones_estate_name_unique');
        });

        Schema::table('estate_users_membership', function (Blueprint $table) {
            $table->foreign('zone_id')->references('id')->on('zones')->nullOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('estate_users_membership', function (Blueprint $table) {
            $table->dropForeign(['zone_id']);
        });
        Schema::dropIfExists('zones');
    }
};
