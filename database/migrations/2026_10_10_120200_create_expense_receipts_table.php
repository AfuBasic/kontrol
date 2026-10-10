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
        Schema::create('expense_receipts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('expense_id')->constrained()->restrictOnDelete();
            // Path on the private disk. Never a public URL.
            $table->string('path');
            $table->string('original_name');
            $table->string('mime', 100);
            $table->unsignedInteger('size');
            $table->softDeletes();
            $table->timestamps();

            $table->index('expense_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('expense_receipts');
    }
};
