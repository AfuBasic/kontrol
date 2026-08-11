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
        Schema::create('invitations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('estate_id')->constrained('estates')->cascadeOnDelete();
            $table->string('email');
            $table->enum('relationship_type', ['resident', 'property_owner', 'security', 'staff'])->nullable();
            $table->foreignId('role_id')->nullable()->constrained('roles')->nullOnDelete();
            $table->enum('scope_type', ['estate', 'zone'])->default('estate');
            $table->unsignedBigInteger('zone_id')->nullable();
            $table->string('token', 64)->unique();
            $table->enum('status', ['pending', 'accepted', 'expired', 'cancelled'])->default('pending');
            $table->timestamp('expires_at')->nullable();
            $table->timestamp('accepted_at')->nullable();
            $table->timestamps();

            $table->foreign('zone_id')->references('id')->on('zones')->nullOnDelete();
            $table->unique(['estate_id', 'email'], 'invitations_estate_email_unique');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('invitations');
    }
};
