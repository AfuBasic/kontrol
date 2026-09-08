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
        Schema::create('organization_access_members', function (Blueprint $table) {
            $table->id();
            $table->foreignId('organization_id')->constrained('estate_organizations')->cascadeOnDelete();
            $table->string('name');
            $table->string('identifier')->nullable(); // Student ID, Staff ID, Member ID, etc.
            $table->string('category')->default('staff'); // 'student' | 'staff' | 'member' | 'contractor' | 'visitor' | 'other'
            $table->string('status')->default('active'); // 'active' | 'suspended' | 'expired'
            $table->date('valid_from')->nullable();
            $table->date('valid_until')->nullable();
            $table->json('metadata')->nullable(); // Department, grade, vehicle_reg, notes, etc.
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index(['organization_id', 'status']);
            $table->index(['organization_id', 'category']);
            $table->index(['organization_id', 'identifier']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('organization_access_members');
    }
};
