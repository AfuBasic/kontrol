<?php

use App\Enums\PartnerRequestStatus;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('partner_requests', function (Blueprint $table) {
            $table->id();
            $table->string('estate_name');
            $table->string('estate_address')->nullable();
            $table->string('chairman_name');
            $table->string('chairman_phone');
            $table->string('chairman_email');
            $table->unsignedInteger('number_of_houses')->nullable();
            $table->string('state')->nullable();
            $table->string('lga')->nullable();
            $table->text('notes')->nullable();
            $table->foreignId('referrer_id')->constrained('referrers')->cascadeOnDelete();
            $table->foreignId('estate_id')->nullable()->constrained()->nullOnDelete();
            $table->enum('status', array_column(PartnerRequestStatus::cases(), 'value'))->default(PartnerRequestStatus::Submitted->value);
            $table->text('rejection_reason')->nullable();
            $table->text('info_request_message')->nullable();
            $table->timestamps();

            $table->index(['referrer_id', 'status']);
            $table->index('status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('partner_requests');
    }
};
