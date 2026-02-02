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
        Schema::create('estate_board_posts', function (Blueprint $table) {
            $table->id();
            $table->foreignIdFor(Estate::class)->constrained()->cascadeOnDelete();
            $table->foreignIdFor(User::class)->constrained()->cascadeOnDelete();
            $table->string('title')->nullable();
            $table->text('body');
            $table->enum('status', ['draft', 'published'])->default('draft');
            $table->enum('audience', ['all', 'residents', 'security'])->default('all');
            $table->timestamp('published_at')->nullable();
            $table->timestamps();

            $table->index(['estate_id', 'published_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('estate_board_posts');
    }
};
