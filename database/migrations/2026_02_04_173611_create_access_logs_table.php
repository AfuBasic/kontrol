<?php

use App\Models\AccessCode;
use App\Models\Estate;
use App\Models\User;
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
        Schema::create('access_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignIdFor(Estate::class)->constrained()->cascadeOnDelete();
            $table->foreignIdFor(AccessCode::class)->constrained()->cascadeOnDelete();
            $table->foreignIdFor(User::class, 'verified_by')->constrained()->cascadeOnDelete();
            $table->json('meta')->nullable();
            $table->timestamp('verified_at');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('access_logs');
    }
};
