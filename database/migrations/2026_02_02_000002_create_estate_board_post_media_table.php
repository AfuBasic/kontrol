<?php

use App\Models\Estate;
use App\Models\EstateBoardPost;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('estate_board_post_media', function (Blueprint $table) {
            $table->id();
            $table->foreignIdFor(EstateBoardPost::class)->constrained()->cascadeOnDelete();
            $table->foreignIdFor(Estate::class)->constrained()->cascadeOnDelete();
            $table->string('disk')->default('cloudinary');
            $table->string('path');
            $table->string('url');
            $table->string('mime_type');
            $table->unsignedBigInteger('size_bytes');
            $table->unsignedInteger('width')->nullable();
            $table->unsignedInteger('height')->nullable();
            $table->string('hash', 64);
            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->timestamps();

            $table->index(['estate_id', 'hash']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('estate_board_post_media');
    }
};
