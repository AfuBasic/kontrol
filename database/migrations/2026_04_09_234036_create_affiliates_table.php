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
        Schema::create('affiliates', function (Blueprint $table): void {
            $table->id();
            $table->string('name')->unique();
            $table->string('email')->unique();
            $table->text('description')->nullable();
            $table->string('website')->nullable();
            $table->string('contact_person')->nullable();
            $table->string('phone')->nullable();
            $table->decimal('commission_rate', 5, 2)->default(0)->comment('Commission percentage (0-100)');
            $table->enum('status', ['active', 'inactive', 'suspended'])->default('active');
            $table->string('api_key')->unique()->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
            $table->index('status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('affiliates');
    }
};
