<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('estate_applications', function (Blueprint $table) {
            if (! Schema::hasColumn('estate_applications', 'source')) {
                $table->string('source')->default('public')->after('id')->index();
            }
            if (! Schema::hasColumn('estate_applications', 'partner_id')) {
                $table->foreignId('partner_id')->nullable()->after('source')->constrained()->nullOnDelete();
            }
            if (! Schema::hasColumn('estate_applications', 'estate_id')) {
                $table->foreignId('estate_id')->nullable()->after('partner_id')->constrained()->nullOnDelete();
            }
            if (! Schema::hasColumn('estate_applications', 'contact_name')) {
                $table->string('contact_name')->nullable()->after('estate_name');
            }
            if (! Schema::hasColumn('estate_applications', 'number_of_houses')) {
                $table->unsignedInteger('number_of_houses')->nullable()->after('phone');
            }
            if (! Schema::hasColumn('estate_applications', 'state')) {
                $table->string('state')->nullable()->after('address');
            }
            if (! Schema::hasColumn('estate_applications', 'lga')) {
                $table->string('lga')->nullable()->after('state');
            }
            if (! Schema::hasColumn('estate_applications', 'rejection_reason')) {
                $table->text('rejection_reason')->nullable()->after('challenges');
            }
            if (! Schema::hasColumn('estate_applications', 'info_request_message')) {
                $table->text('info_request_message')->nullable()->after('rejection_reason');
            }
        });

        // Plan selection is no longer part of intake - drop FK and column.
        if (Schema::hasColumn('estate_applications', 'plan_id')) {
            Schema::table('estate_applications', function (Blueprint $table) {
                $table->dropConstrainedForeignId('plan_id');
            });
        }

        if (Schema::hasTable('partner_requests')) {
            $rows = DB::table('partner_requests')->orderBy('id')->get();

            foreach ($rows as $row) {
                $status = match ($row->status) {
                    'submitted' => 'received',
                    'reviewing' => 'under_review',
                    'info_requested' => 'info_requested',
                    'approved', 'estate_created' => 'approved',
                    'rejected' => 'rejected',
                    default => 'received',
                };

                DB::table('estate_applications')->insert([
                    'source' => 'partner',
                    'partner_id' => $row->partner_id,
                    'estate_id' => $row->estate_id,
                    'estate_name' => $row->estate_name,
                    'contact_name' => $row->chairman_name,
                    'email' => $row->chairman_email,
                    'phone' => $row->chairman_phone ?? '',
                    'address' => $row->estate_address,
                    'state' => $row->state,
                    'lga' => $row->lga,
                    'number_of_houses' => $row->number_of_houses,
                    'notes' => $row->notes,
                    'status' => $status,
                    'rejection_reason' => $row->rejection_reason,
                    'info_request_message' => $row->info_request_message,
                    'reviewed_at' => in_array($status, ['approved', 'rejected'], true) ? ($row->updated_at ?? now()) : null,
                    'created_at' => $row->created_at ?? now(),
                    'updated_at' => $row->updated_at ?? now(),
                ]);
            }

            Schema::dropIfExists('partner_requests');
        }
    }

    public function down(): void
    {
        Schema::table('estate_applications', function (Blueprint $table) {
            if (! Schema::hasColumn('estate_applications', 'plan_id')) {
                $table->foreignId('plan_id')->nullable()->constrained()->nullOnDelete();
            }
        });

        Schema::table('estate_applications', function (Blueprint $table) {
            if (Schema::hasColumn('estate_applications', 'partner_id')) {
                $table->dropConstrainedForeignId('partner_id');
            }
            if (Schema::hasColumn('estate_applications', 'estate_id')) {
                $table->dropConstrainedForeignId('estate_id');
            }

            $drop = collect([
                'source',
                'contact_name',
                'number_of_houses',
                'state',
                'lga',
                'rejection_reason',
                'info_request_message',
            ])->filter(fn (string $column) => Schema::hasColumn('estate_applications', $column))->all();

            if ($drop !== []) {
                $table->dropColumn($drop);
            }
        });
    }
};
