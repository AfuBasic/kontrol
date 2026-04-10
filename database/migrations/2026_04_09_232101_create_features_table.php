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
        Schema::create('features', function (Blueprint $table): void {
            $table->id();
            $table->string('name');
            $table->string('slug')->unique()->index();
            $table->text('description')->nullable();
            $table->string('group')->default('core')->comment('AI, Notifications, Integrations, Core');
            $table->boolean('is_global')->default(false)->comment('Available to all plans');
            $table->boolean('is_active')->default(true);
            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('features');
    }
};
