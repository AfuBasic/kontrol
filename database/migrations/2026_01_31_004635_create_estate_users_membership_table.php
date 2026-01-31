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
        Schema::create('estate_users_membership', function (Blueprint $table) {
            $table->id();
            $table->foreignIdFor(Estate::class)->constrained()->cascadeOnDelete();
            $table->foreignIdFor(User::class)->constrained()->cascadeOnDelete();
            $table->enum('status', ['pending', 'accepted'])->default('pending');
            $table->timestamps();

            $table->unique(['estate_id', 'user_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('estate_users_membership');
    }
};
