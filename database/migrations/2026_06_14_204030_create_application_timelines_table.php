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
        Schema::create('application_timelines', function (Blueprint $table) {
            $table->id();
            $table->foreignId('estate_application_id')->constrained()->cascadeOnDelete();
            $table->string('event_type'); // e.g. 'status_changed', 'note_added', 'demo_scheduled'
            $table->text('description');
            $table->json('metadata')->nullable();
            $table->string('creator_name')->nullable(); // The user who triggered the event
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('application_timelines');
    }
};
