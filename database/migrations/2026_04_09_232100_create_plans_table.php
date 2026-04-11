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
        Schema::create('plans', function (Blueprint $table): void {
            $table->id();
            $table->string('name');
            $table->string('slug')->unique()->index();
            $table->text('description')->nullable();
            $table->unsignedBigInteger('price')->default(0)->comment('Price in kobo/cents');
            $table->enum('billing_interval', ['quarterly', 'semi-annually', 'annually'])->default('annually');
            $table->boolean('is_featured')->default(false);
            $table->string('badge')->nullable()->comment('e.g. Most Popular, Best Value');
            $table->string('color', 20)->default('blue')->comment('Tailwind color name for display');
            $table->enum('visibility', ['public', 'private'])->default('public');
            $table->unsignedInteger('max_residents')->nullable()->comment('null = unlimited');
            $table->unsignedInteger('max_security')->nullable()->comment('null = unlimited');
            $table->unsignedInteger('max_admins')->nullable()->comment('null = unlimited');
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
        Schema::dropIfExists('plans');
    }
};
