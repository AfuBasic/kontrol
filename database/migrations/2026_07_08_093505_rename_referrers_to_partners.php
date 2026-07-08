<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (DB::getDriverName() === 'sqlite') {
            $this->renameReferrersToPartners();

            return;
        }

        $this->dropForeignIfExists('commission_plans', 'commission_plans_source_referrer_id_foreign');
        $this->dropForeignIfExists('commissionable_revenues', 'commissionable_revenues_referrer_id_foreign');
        $this->dropForeignIfExists('estates', 'estates_affiliate_id_foreign');
        $this->dropForeignIfExists('partner_requests', 'partner_requests_referrer_id_foreign');
        $this->dropForeignIfExists('users', 'users_referrer_id_foreign');

        $this->renameReferrersToPartners();

        $this->addForeignIfMissing('commission_plans', 'source_partner_id', 'partners', 'nullOnDelete');
        $this->addForeignIfMissing('commissionable_revenues', 'partner_id', 'partners', 'cascadeOnDelete');
        $this->addForeignIfMissing('estates', 'partner_id', 'partners', 'nullOnDelete');
        $this->addForeignIfMissing('partner_requests', 'partner_id', 'partners', 'cascadeOnDelete');

        if (! $this->indexExists('partner_requests', 'partner_requests_partner_id_status_index')) {
            try {
                Schema::table('partner_requests', function (Blueprint $table) {
                    $table->index(['partner_id', 'status']);
                });
            } catch (Throwable) {
                // Index may already exist under a different name in sqlite tests.
            }
        }

        $this->addForeignIfMissing('users', 'partner_id', 'partners', 'nullOnDelete');
    }

    public function down(): void
    {
        $this->dropForeignIfExists('commission_plans', 'commission_plans_source_partner_id_foreign');
        $this->dropForeignIfExists('commissionable_revenues', 'commissionable_revenues_partner_id_foreign');
        $this->dropIndexIfExists('commissionable_revenues', 'commissionable_revenues_estate_id_partner_id_index');
        $this->dropForeignIfExists('estates', 'estates_partner_id_foreign');
        $this->dropForeignIfExists('partner_requests', 'partner_requests_partner_id_foreign');
        $this->dropIndexIfExists('partner_requests', 'partner_requests_partner_id_status_index');
        $this->dropForeignIfExists('users', 'users_partner_id_foreign');

        if (Schema::hasTable('partners')) {
            Schema::rename('partners', 'referrers');
        }

        if (Schema::hasColumn('commission_plans', 'source_partner_id')) {
            Schema::table('commission_plans', function (Blueprint $table) {
                $table->renameColumn('source_partner_id', 'source_referrer_id');
            });
        }

        if (Schema::hasColumn('commissionable_revenues', 'partner_id')) {
            Schema::table('commissionable_revenues', function (Blueprint $table) {
                $table->renameColumn('partner_id', 'referrer_id');
            });
        }

        if (Schema::hasColumn('estates', 'partner_id')) {
            Schema::table('estates', function (Blueprint $table) {
                $table->renameColumn('partner_id', 'referrer_id');
            });
        }

        if (Schema::hasColumn('partner_requests', 'partner_id')) {
            Schema::table('partner_requests', function (Blueprint $table) {
                $table->renameColumn('partner_id', 'referrer_id');
            });
        }

        if (Schema::hasColumn('users', 'partner_id')) {
            Schema::table('users', function (Blueprint $table) {
                $table->renameColumn('partner_id', 'referrer_id');
            });
        }

        Schema::table('commission_plans', function (Blueprint $table) {
            $table->foreign('source_referrer_id')->references('id')->on('referrers')->nullOnDelete();
        });

        Schema::table('commissionable_revenues', function (Blueprint $table) {
            $table->foreign('referrer_id')->references('id')->on('referrers')->cascadeOnDelete();
            $table->index(['estate_id', 'referrer_id'], 'commissionable_revenues_estate_id_referrer_id_index');
        });

        Schema::table('estates', function (Blueprint $table) {
            $table->foreign('referrer_id')->references('id')->on('referrers')->nullOnDelete();
        });

        Schema::table('partner_requests', function (Blueprint $table) {
            $table->foreign('referrer_id')->references('id')->on('referrers')->cascadeOnDelete();
            $table->index(['referrer_id', 'status']);
        });

        Schema::table('users', function (Blueprint $table) {
            $table->foreign('referrer_id')->references('id')->on('referrers')->nullOnDelete();
        });
    }

    private function dropForeignIfExists(string $table, string $constraint): void
    {
        if (! $this->foreignExists($table, $constraint)) {
            return;
        }

        try {
            Schema::table($table, function (Blueprint $blueprint) use ($constraint) {
                $blueprint->dropForeign($constraint);
            });
        } catch (Throwable) {
            // Constraint may already be removed in partially-applied environments.
        }
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
            // Index may be required by another constraint or already removed.
        }
    }

    private function renameReferrersToPartners(): void
    {
        if (Schema::hasTable('referrers')) {
            Schema::rename('referrers', 'partners');
        }

        if (Schema::hasColumn('commission_plans', 'source_referrer_id')) {
            Schema::table('commission_plans', function (Blueprint $table) {
                $table->renameColumn('source_referrer_id', 'source_partner_id');
            });
        }

        if (Schema::hasColumn('commissionable_revenues', 'referrer_id')) {
            Schema::table('commissionable_revenues', function (Blueprint $table) {
                $table->renameColumn('referrer_id', 'partner_id');
            });
        }

        if (Schema::hasColumn('estates', 'referrer_id')) {
            Schema::table('estates', function (Blueprint $table) {
                $table->renameColumn('referrer_id', 'partner_id');
            });
        }

        if (Schema::hasColumn('partner_requests', 'referrer_id')) {
            $this->dropIndexIfExists('partner_requests', 'partner_requests_referrer_id_status_index');

            Schema::table('partner_requests', function (Blueprint $table) {
                $table->renameColumn('referrer_id', 'partner_id');
            });
        }

        if (Schema::hasColumn('users', 'referrer_id')) {
            Schema::table('users', function (Blueprint $table) {
                $table->renameColumn('referrer_id', 'partner_id');
            });
        }
    }

    private function addForeignIfMissing(string $table, string $column, string $referencesTable, string $onDelete): void
    {
        try {
            Schema::table($table, function (Blueprint $blueprint) use ($column, $referencesTable, $onDelete) {
                $foreign = $blueprint->foreign($column)->references('id')->on($referencesTable);

                if ($onDelete === 'cascadeOnDelete') {
                    $foreign->cascadeOnDelete();
                } else {
                    $foreign->nullOnDelete();
                }
            });
        } catch (Throwable) {
            // Foreign key may already exist in sqlite test databases.
        }
    }

    private function foreignExists(string $table, string $constraint): bool
    {
        if (DB::getDriverName() === 'sqlite') {
            return false;
        }

        return (bool) DB::selectOne(
            'SELECT CONSTRAINT_NAME FROM information_schema.TABLE_CONSTRAINTS
             WHERE CONSTRAINT_SCHEMA = DATABASE()
             AND TABLE_NAME = ?
             AND CONSTRAINT_NAME = ?
             AND CONSTRAINT_TYPE = ?',
            [$table, $constraint, 'FOREIGN KEY']
        );
    }

    private function indexExists(string $table, string $index): bool
    {
        if (DB::getDriverName() === 'sqlite') {
            return false;
        }

        return (bool) DB::selectOne(
            'SELECT INDEX_NAME FROM information_schema.STATISTICS
             WHERE TABLE_SCHEMA = DATABASE()
             AND TABLE_NAME = ?
             AND INDEX_NAME = ?',
            [$table, $index]
        );
    }
};
