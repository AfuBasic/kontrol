<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::dropIfExists('quick_entry_allocations');
    }

    public function down(): void
    {
        Schema::create('quick_entry_allocations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('estate_id')->constrained('estates')->cascadeOnDelete();
            $table->string('tag_prefix');
            $table->string('tag_start');
            $table->string('tag_end');
            $table->string('gate_device_id')->nullable();
            $table->unsignedInteger('used_count')->default(0);
            $table->unsignedInteger('total_count');
            $table->timestamp('expires_at')->nullable();
            $table->timestamps();
        });
    }
};
