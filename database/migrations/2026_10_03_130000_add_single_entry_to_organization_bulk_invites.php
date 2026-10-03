<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Lets a group choose that each of its passes opens the gate once. Existing groups stay as they are
 * (repeat entry until the pass expires), so nothing changes for them.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('organization_bulk_invites', function (Blueprint $table) {
            $table->boolean('single_entry')->default(false)->after('send_immediately');
        });
    }

    public function down(): void
    {
        Schema::table('organization_bulk_invites', function (Blueprint $table) {
            $table->dropColumn('single_entry');
        });
    }
};
