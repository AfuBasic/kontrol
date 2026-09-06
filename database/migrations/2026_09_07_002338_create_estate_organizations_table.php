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
        Schema::create('estate_organizations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('estate_id')->constrained('estates')->cascadeOnDelete();
            $table->string('name');
            $table->string('type')->default('other'); // school, church, hospital, business, facility, other
            $table->json('operating_hours')->nullable();
            $table->boolean('quick_entry_enabled')->default(true);
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->index(['estate_id', 'is_active']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('estate_organizations');
    }
};
