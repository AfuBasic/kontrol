<?php

use App\Models\Estate;
use App\Models\User;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('household_members', function (Blueprint $table) {
            $table->id();
            $table->foreignIdFor(Estate::class)->constrained()->cascadeOnDelete();
            $table->foreignIdFor(User::class, 'primary_resident_id')->constrained('users')->cascadeOnDelete();
            $table->foreignIdFor(User::class, 'household_member_id')->constrained('users')->cascadeOnDelete();
            $table->timestamps();

            $table->unique(['estate_id', 'household_member_id']);
            $table->index(['estate_id', 'primary_resident_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('household_members');
    }
};
