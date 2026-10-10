<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    private const DEFAULTS = [
        'Hosting and infrastructure',
        'SMS and email',
        'Payment fees',
        'Contractors and salaries',
        'Marketing',
        'Software and tools',
        'Legal and accounting',
        'Travel and office',
        'Taxes',
        'Other',
    ];

    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('expense_categories', function (Blueprint $table) {
            $table->id();
            $table->string('name', 80)->unique();
            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->softDeletes();
            $table->timestamps();
        });

        // Starting categories, so the first expense can be logged straight away. They can be renamed or archived.
        $now = now();
        DB::table('expense_categories')->insert(array_map(
            fn (string $name, int $index) => ['name' => $name, 'sort_order' => $index, 'created_at' => $now, 'updated_at' => $now],
            self::DEFAULTS,
            array_keys(self::DEFAULTS),
        ));
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('expense_categories');
    }
};
