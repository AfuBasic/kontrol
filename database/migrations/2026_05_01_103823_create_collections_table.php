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
        Schema::create('collections', function (Blueprint $table) {
            $table->id();
            $table->foreignId('estate_id')->constrained()->onDelete('cascade');
            $table->string('name');
            $table->text('description')->nullable();
            $table->unsignedBigInteger('amount'); // in kobo
            $table->string('billing_type'); // one_time, recurring
            $table->string('recurring_interval')->nullable(); // monthly, yearly
            $table->date('start_date');
            $table->unsignedTinyInteger('due_day')->default(1); // 1-28
            $table->unsignedInteger('grace_days')->default(0);
            $table->unsignedBigInteger('late_fee')->nullable(); // in kobo
            $table->string('applies_to')->default('all'); // all, target
            $table->string('status')->default('draft'); // draft, active, archived
            $table->foreignId('created_by')->constrained('users')->onDelete('cascade');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('collections');
    }
};
