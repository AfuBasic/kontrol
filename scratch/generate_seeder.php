<?php

require __DIR__.'/../vendor/autoload.php';
$app = require_once __DIR__.'/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Plan;

$plans = Plan::with('features')->get();

$output = "<?php\n\nnamespace Database\\Seeders;\n\nuse App\\Models\\Feature;\nuse App\\Models\\Plan;\nuse Illuminate\\Database\\Seeder;\n\nclass PlanSeeder extends Seeder\n{\n    public function run(): void\n    {\n";

foreach ($plans as $plan) {
    $planData = $plan->only([
        'name', 'slug', 'description', 'price', 'billing_interval',
        'is_featured', 'badge', 'color', 'visibility',
        'max_residents', 'max_security', 'max_admins', 'sort_order', 'is_active',
    ]);

    $output .= "        \$plan = Plan::updateOrCreate(['slug' => '{$plan->slug}'], ".var_export($planData, true).");\n\n";

    $features = [];
    foreach ($plan->features as $feature) {
        $features[$feature->id] = [
            'is_enabled' => (bool) $feature->pivot->is_enabled,
            'limit' => $feature->pivot->limit,
        ];
    }

    $output .= '        $plan->features()->sync('.var_export($features, true).");\n\n";
}

$output .= "    }\n}\n";

echo $output;
