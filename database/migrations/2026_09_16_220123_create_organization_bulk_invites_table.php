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
        Schema::create('organization_bulk_invites', function (Blueprint $table) {
            $table->id();
            $table->foreignId('organization_id')->constrained('estate_organizations')->cascadeOnDelete();
            $table->foreignId('estate_id')->constrained('estates')->cascadeOnDelete();
            $table->foreignId('created_by')->constrained('users')->cascadeOnDelete();
            $table->string('name')->nullable();
            $table->string('purpose')->nullable();
            $table->date('valid_from');
            $table->date('valid_until');
            $table->boolean('auto_renew')->default(false);
            $table->enum('status', ['active', 'paused', 'cancelled'])->default('active');
            $table->string('renewal_blocked_reason')->nullable();
            $table->timestamp('last_renewed_at')->nullable();
            $table->date('next_renewal_at')->nullable();
            $table->timestamps();

            $table->index(['organization_id', 'status'], 'org_bulk_invites_org_status_idx');
            $table->index(['estate_id', 'status'], 'org_bulk_invites_estate_status_idx');
            $table->index(['auto_renew', 'status', 'next_renewal_at'], 'org_bulk_invites_renew_idx');
        });

        Schema::create('organization_bulk_invite_recipients', function (Blueprint $table) {
            $table->id();
            $table->foreignId('bulk_invite_id')->constrained('organization_bulk_invites')->cascadeOnDelete();
            $table->string('email');
            $table->enum('status', ['active', 'revoked', 'opted_out'])->default('active');
            $table->foreignId('last_access_code_id')->nullable()->constrained('access_codes')->nullOnDelete();
            $table->timestamp('last_delivered_at')->nullable();
            $table->timestamps();

            $table->unique(['bulk_invite_id', 'email'], 'org_bulk_recipients_invite_email_uniq');
            $table->index(['bulk_invite_id', 'status'], 'org_bulk_recipients_invite_status_idx');
        });

        Schema::create('organization_bulk_invite_renewals', function (Blueprint $table) {
            $table->id();
            $table->foreignId('bulk_invite_id')->constrained('organization_bulk_invites')->cascadeOnDelete();
            $table->string('cycle_key');
            $table->date('valid_from');
            $table->date('valid_until');
            $table->enum('status', ['pending', 'processing', 'completed', 'failed', 'blocked'])->default('pending');
            $table->timestamp('processed_at')->nullable();
            $table->unsignedInteger('recipients_renewed')->default(0);
            $table->unsignedInteger('recipients_blocked')->default(0);
            $table->string('blocked_reason')->nullable();
            $table->timestamps();

            $table->unique(['bulk_invite_id', 'cycle_key'], 'org_bulk_renewals_invite_cycle_uniq');
            $table->index(['bulk_invite_id', 'status'], 'org_bulk_renewals_invite_status_idx');
        });

        Schema::table('access_codes', function (Blueprint $table) {
            $table->foreignId('bulk_invite_recipient_id')
                ->nullable()
                ->after('organization_member_id')
                ->constrained('organization_bulk_invite_recipients')
                ->nullOnDelete();

            $table->index(['bulk_invite_recipient_id', 'status'], 'access_codes_bulk_recipient_status_idx');
        });
    }

    public function down(): void
    {
        Schema::table('access_codes', function (Blueprint $table) {
            $table->dropForeign(['bulk_invite_recipient_id']);
            $table->dropIndex(['bulk_invite_recipient_id', 'status']);
            $table->dropColumn('bulk_invite_recipient_id');
        });

        Schema::dropIfExists('organization_bulk_invite_renewals');
        Schema::dropIfExists('organization_bulk_invite_recipients');
        Schema::dropIfExists('organization_bulk_invites');
    }
};
