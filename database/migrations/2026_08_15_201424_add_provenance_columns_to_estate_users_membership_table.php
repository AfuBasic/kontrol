<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('estate_users_membership', function (Blueprint $table) {
            $table->unsignedBigInteger('initiated_by')->nullable()->after('created_via');
            $table->timestamp('initiated_at')->nullable()->after('initiated_by');
            $table->unsignedBigInteger('last_invited_by')->nullable()->after('initiated_at');
            $table->timestamp('last_invited_at')->nullable()->after('last_invited_by');
            $table->unsignedBigInteger('invitation_id')->nullable()->after('last_invited_at');
            $table->unsignedBigInteger('invitation_link_id')->nullable()->after('invitation_id');
            $table->string('import_batch')->nullable()->after('invitation_link_id');
            $table->timestamp('accepted_at')->nullable()->after('import_batch');

            $table->foreign('initiated_by')->references('id')->on('users')->nullOnDelete();
            $table->foreign('last_invited_by')->references('id')->on('users')->nullOnDelete();
            $table->foreign('invitation_id')->references('id')->on('invitations')->nullOnDelete();
            $table->foreign('invitation_link_id')->references('id')->on('estate_invite_links')->nullOnDelete();
        });

        // 1. Backfill accepted_at for existing accepted status
        DB::table('estate_users_membership')
            ->where('status', 'accepted')
            ->update(['accepted_at' => DB::raw('updated_at')]);

        // 2. Backfill invitation/initiator details for legacy admin_invite records
        $memberships = DB::table('estate_users_membership')
            ->join('users', 'estate_users_membership.user_id', '=', 'users.id')
            ->where('estate_users_membership.created_via', 'admin_invite')
            ->select('estate_users_membership.id', 'estate_users_membership.estate_id', 'users.email')
            ->get();

        foreach ($memberships as $membership) {
            $invitation = DB::table('invitations')
                ->where('estate_id', $membership->estate_id)
                ->where('email', strtolower(trim($membership->email)))
                ->first();

            if ($invitation) {
                DB::table('estate_users_membership')
                    ->where('id', $membership->id)
                    ->update([
                        'invitation_id' => $invitation->id,
                        'initiated_by' => $invitation->created_by,
                        'initiated_at' => $invitation->created_at,
                        'last_invited_by' => $invitation->created_by,
                        'last_invited_at' => $invitation->created_at,
                        'accepted_at' => $invitation->accepted_at ?? ($membership->accepted_at ?? null),
                    ]);
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('estate_users_membership', function (Blueprint $table) {
            $table->dropForeign(['initiated_by']);
            $table->dropForeign(['last_invited_by']);
            $table->dropForeign(['invitation_id']);
            $table->dropForeign(['invitation_link_id']);

            $table->dropColumn([
                'initiated_by',
                'initiated_at',
                'last_invited_by',
                'last_invited_at',
                'invitation_id',
                'invitation_link_id',
                'import_batch',
                'accepted_at',
            ]);
        });
    }
};
