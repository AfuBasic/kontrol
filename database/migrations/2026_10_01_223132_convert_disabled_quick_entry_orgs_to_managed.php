<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * The per-organization "Quick Entry" switch is retired: whether an organization takes walk-ins
 * is decided by its access policy alone. Organizations that had the switch off while their
 * policy still allowed walk-ins keep the intent they expressed: no walk-ins.
 *
 * The quick_entry_enabled column itself is left in place (now unused).
 */
return new class extends Migration
{
    public function up(): void
    {
        DB::table('estate_organizations')
            ->where('quick_entry_enabled', false)
            ->where('access_policy', '!=', 'managed')
            ->update(['access_policy' => 'managed']);
    }

    public function down(): void
    {
        // Not reversible: the previous policy of converted organizations is not recorded.
    }
};
