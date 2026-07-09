<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Production may retain legacy unique index names from affiliates/referrers
     * renames, or may have already dropped some indexes. Never assume a fixed name.
     */
    public function up(): void
    {
        if (! Schema::hasTable('partners')) {
            return;
        }

        // Drop unique indexes first (must be separate statements; Blueprint try/catch
        // does not wrap execution of queued ALTER commands).
        foreach ([
            'affiliates_email_unique',
            'referrers_email_unique',
            'partners_email_unique',
            'affiliates_phone_unique',
            'referrers_phone_unique',
            'partners_phone_unique',
        ] as $index) {
            $this->dropIndexIfExists('partners', $index);
        }

        // Also drop uniques by column list when the index still exists under an unknown name.
        if (Schema::hasColumn('partners', 'email')) {
            $this->dropUniqueByColumns('partners', ['email']);
        }

        if (Schema::hasColumn('partners', 'phone')) {
            $this->dropUniqueByColumns('partners', ['phone']);
        }

        $columnsToDrop = array_values(array_filter(
            ['email', 'phone'],
            fn (string $column) => Schema::hasColumn('partners', $column),
        ));

        if ($columnsToDrop === []) {
            return;
        }

        Schema::table('partners', function (Blueprint $table) use ($columnsToDrop) {
            $table->dropColumn($columnsToDrop);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (! Schema::hasTable('partners')) {
            return;
        }

        Schema::table('partners', function (Blueprint $table) {
            if (! Schema::hasColumn('partners', 'email')) {
                $table->string('email')->nullable()->unique();
            }

            if (! Schema::hasColumn('partners', 'phone')) {
                $table->string('phone')->nullable()->unique();
            }
        });
    }

    private function dropIndexIfExists(string $table, string $index): void
    {
        if (! $this->indexExists($table, $index)) {
            return;
        }

        try {
            Schema::table($table, function (Blueprint $blueprint) use ($index) {
                $blueprint->dropIndex($index);
            });
        } catch (Throwable) {
            try {
                Schema::table($table, function (Blueprint $blueprint) use ($index) {
                    $blueprint->dropUnique($index);
                });
            } catch (Throwable) {
                // Index may already be gone or named differently.
            }
        }
    }

    /**
     * @param  list<string>  $columns
     */
    private function dropUniqueByColumns(string $table, array $columns): void
    {
        try {
            Schema::table($table, function (Blueprint $blueprint) use ($columns) {
                $blueprint->dropUnique($columns);
            });
        } catch (Throwable) {
            // Unique constraint may not exist under the default column-based name.
        }
    }

    private function indexExists(string $table, string $index): bool
    {
        $driver = DB::getDriverName();

        if ($driver === 'sqlite') {
            $rows = DB::select("PRAGMA index_list('{$table}')");

            foreach ($rows as $row) {
                $name = $row->name ?? $row->Name ?? null;
                if ($name === $index) {
                    return true;
                }
            }

            return false;
        }

        if ($driver !== 'mysql') {
            return false;
        }

        return (bool) DB::selectOne(
            'SELECT INDEX_NAME FROM information_schema.STATISTICS
             WHERE TABLE_SCHEMA = DATABASE()
             AND TABLE_NAME = ?
             AND INDEX_NAME = ?
             LIMIT 1',
            [$table, $index]
        );
    }
};
