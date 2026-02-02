<?php

use App\Models\Estate;
use App\Models\EstateBoardPost;
use App\Models\User;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('estate_board_comments', function (Blueprint $table) {
            $table->id();
            $table->foreignIdFor(EstateBoardPost::class)->constrained()->cascadeOnDelete();
            $table->foreignIdFor(Estate::class)->constrained()->cascadeOnDelete();
            $table->foreignIdFor(User::class)->constrained()->cascadeOnDelete();
            $table->text('body');
            $table->foreignId('parent_id')->nullable()->constrained('estate_board_comments')->nullOnDelete();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['estate_board_post_id', 'created_at']);
            $table->index(['user_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('estate_board_comments');
    }
};
