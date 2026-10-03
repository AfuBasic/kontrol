<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Deleting a group hides it everywhere and revokes its passes, but keeps the row so who was invited,
 * what was delivered and who came in stays auditable.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('organization_bulk_invites', function (Blueprint $table) {
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::table('organization_bulk_invites', function (Blueprint $table) {
            $table->dropSoftDeletes();
        });
    }
};
