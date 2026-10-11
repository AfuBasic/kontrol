<?php

use App\Models\Expense;
use App\Models\ExpenseCategory;
use App\Models\ExpenseReceipt;
use App\Models\Plan;
use App\Models\ResidentSubscription;
use App\Services\Zeus\ExpenseService;
use App\Services\Zeus\PlatformAnalyticsService;
use App\Services\Zeus\Receipts\CloudReceiptClient;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Spatie\Activitylog\Models\Activity;

uses(RefreshDatabase::class);

beforeEach(function () {
    Storage::fake('local');

    $this->zeus = fn () => $this->withSession([config('zeus.session_key') => true]);
    $this->category = ExpenseCategory::query()->where('name', 'Hosting and infrastructure')->first()
        ?? ExpenseCategory::create(['name' => 'Hosting and infrastructure']);

    $this->payload = fn (array $overrides = []): array => [
        'incurred_on' => now()->toDateString(),
        'amount' => '12500.50',
        'expense_category_id' => $this->category->id,
        'payee' => 'Hetzner',
        'note' => 'October servers',
        ...$overrides,
    ];

    $this->makeExpense = fn (array $overrides = []): Expense => Expense::create([
        'incurred_on' => now()->toDateString(),
        'amount' => 100000,
        'expense_category_id' => $this->category->id,
        'payee' => 'Vendor',
        ...$overrides,
    ]);
});

// ---------- Only Zeus gets in ----------

it('keeps everything behind the Zeus session', function () {
    $expense = ($this->makeExpense)();
    $receipt = $expense->receipts()->create(['path' => 'x.pdf', 'original_name' => 'x.pdf', 'mime' => 'application/pdf', 'size' => 1]);

    foreach ([
        ['get', route('zeus.expenses.index')],
        ['get', route('zeus.expenses.export')],
        ['post', route('zeus.expenses.store')],
        ['put', route('zeus.expenses.update', $expense)],
        ['delete', route('zeus.expenses.destroy', $expense)],
        ['post', route('zeus.expenses.restore', $expense)],
        ['get', route('zeus.expenses.receipts.show', $receipt)],
        ['delete', route('zeus.expenses.receipts.destroy', $receipt)],
        ['post', route('zeus.expenses.categories.store')],
        ['put', route('zeus.expenses.categories.update', $this->category)],
        ['delete', route('zeus.expenses.categories.destroy', $this->category)],
    ] as [$method, $url]) {
        $this->{$method}($url)->assertRedirect(route('zeus.login'));
    }

    expect(Expense::count())->toBe(1);
});

// ---------- Recording ----------

it('records an expense in kobo and logs it', function () {
    ($this->zeus)()->post(route('zeus.expenses.store'), ($this->payload)())->assertSessionHasNoErrors();

    $expense = Expense::first();
    expect($expense->amount)->toBe(1250050)
        ->and($expense->payee)->toBe('Hetzner')
        ->and($expense->incurred_on->toDateString())->toBe(now()->toDateString());

    $log = Activity::where('description', 'Expense recorded')->first();
    expect($log)->not->toBeNull()->and($log->getExtraProperty('actor'))->toBe('zeus');
});

it('stores receipts privately under random names and trusts the file content, not the browser', function () {
    $pdf = UploadedFile::fake()->create('invoice for october.pdf', 120, 'application/pdf');
    $image = UploadedFile::fake()->image('slip.png', 200, 200);

    ($this->zeus)()->post(route('zeus.expenses.store'), ($this->payload)(['receipts' => [$pdf, $image]]))->assertSessionHasNoErrors();

    $receipts = Expense::first()->receipts;
    expect($receipts)->toHaveCount(2);

    foreach ($receipts as $receipt) {
        Storage::disk('local')->assertExists($receipt->path);
        expect($receipt->path)->toStartWith('expenses/receipts/')->not->toContain('invoice')->not->toContain('slip');
    }

    expect($receipts->pluck('original_name')->all())->toBe(['invoice for october.pdf', 'slip.png']);
});

it('validates the amount, date, category, payee and receipts', function (array $overrides, string $field) {
    ($this->zeus)()->post(route('zeus.expenses.store'), ($this->payload)($overrides))->assertSessionHasErrors($field);

    expect(Expense::count())->toBe(0);
})->with([
    'zero amount' => [['amount' => '0'], 'amount'],
    'negative amount' => [['amount' => '-5'], 'amount'],
    'three decimals' => [['amount' => '10.555'], 'amount'],
    'absurdly large' => [['amount' => '100000000000'], 'amount'],
    'not a number' => [['amount' => 'lots'], 'amount'],
    'future date' => [fn () => ['incurred_on' => now()->addDay()->toDateString()], 'incurred_on'],
    'missing payee' => [['payee' => ''], 'payee'],
    'unknown category' => [['expense_category_id' => 99999], 'expense_category_id'],
]);

it('rejects an archived category, a disguised file, an oversized file and too many receipts', function () {
    $archived = ExpenseCategory::create(['name' => 'Old stuff']);
    $archived->delete();
    ($this->zeus)()->post(route('zeus.expenses.store'), ($this->payload)(['expense_category_id' => $archived->id]))
        ->assertSessionHasErrors('expense_category_id');

    $evilPath = tempnam(sys_get_temp_dir(), 'evil');
    file_put_contents($evilPath, '<?php echo "hi"; ?>');
    $disguised = new UploadedFile($evilPath, 'evil.jpg', 'image/jpeg', null, true);
    ($this->zeus)()->post(route('zeus.expenses.store'), ($this->payload)(['receipts' => [$disguised]]))->assertSessionHasErrors('receipts.0');

    $big = UploadedFile::fake()->create('huge.pdf', 10241, 'application/pdf');
    ($this->zeus)()->post(route('zeus.expenses.store'), ($this->payload)(['receipts' => [$big]]))->assertSessionHasErrors('receipts.0');

    $many = array_map(fn ($i) => UploadedFile::fake()->create("r{$i}.pdf", 10, 'application/pdf'), range(1, 6));
    ($this->zeus)()->post(route('zeus.expenses.store'), ($this->payload)(['receipts' => $many]))->assertSessionHasErrors('receipts');

    expect(Expense::count())->toBe(0);
});

// ---------- Editing ----------

it('updates an expense, adds receipts and logs what changed', function () {
    $expense = ($this->makeExpense)(['payee' => 'Old payee']);

    ($this->zeus)()->put(route('zeus.expenses.update', $expense), ($this->payload)([
        'payee' => 'New payee',
        'amount' => '99.99',
        'receipts' => [UploadedFile::fake()->create('r.pdf', 10, 'application/pdf')],
    ]))->assertSessionHasNoErrors();

    $expense->refresh();
    expect($expense->payee)->toBe('New payee')->and($expense->amount)->toBe(9999)->and($expense->receipts)->toHaveCount(1);

    $log = Activity::where('description', 'Expense updated')->first();
    expect($log->getExtraProperty('old')['payee'])->toBe('Old payee')
        ->and($log->getExtraProperty('attributes')['payee'])->toBe('New payee');
});

// ---------- Archive, never delete ----------

it('archives instead of deleting, keeps the receipts, and can restore', function () {
    ($this->zeus)()->post(route('zeus.expenses.store'), ($this->payload)(['receipts' => [UploadedFile::fake()->create('r.pdf', 10, 'application/pdf')]]));
    $expense = Expense::first();
    $path = $expense->receipts->first()->path;

    ($this->zeus)()->delete(route('zeus.expenses.destroy', $expense))->assertSessionHasNoErrors();

    expect(Expense::count())->toBe(0)
        ->and(Expense::withTrashed()->count())->toBe(1)
        ->and(ExpenseReceipt::count())->toBe(1);
    Storage::disk('local')->assertExists($path);
    expect(Activity::where('description', 'Expense archived')->exists())->toBeTrue();

    ($this->zeus)()->post(route('zeus.expenses.restore', $expense->id))->assertSessionHasNoErrors();

    expect(Expense::count())->toBe(1)->and(Activity::where('description', 'Expense restored')->exists())->toBeTrue();
});

it('leaves archived expenses out of the list and the totals, and shows them under the archived filter', function () {
    ($this->makeExpense)(['payee' => 'Kept', 'amount' => 200000]);
    $gone = ($this->makeExpense)(['payee' => 'Archived one', 'amount' => 900000]);
    $gone->delete();

    ($this->zeus)()->get(route('zeus.expenses.index'))
        ->assertInertia(fn ($page) => $page
            ->where('summary.spent', 200000)
            ->where('summary.count', 1)
            ->has('expenses.data', 1)
            ->where('expenses.data.0.payee', 'Kept')
        );

    ($this->zeus)()->get(route('zeus.expenses.index', ['archived' => 1]))
        ->assertInertia(fn ($page) => $page
            ->has('expenses.data', 1)
            ->where('expenses.data.0.payee', 'Archived one')
            ->where('expenses.data.0.archived', true)
            ->where('summary.spent', 200000)
        );
});

// ---------- Totals ----------

it('sums the month, breaks it down by category, and sets it against recurring revenue', function () {
    $other = ExpenseCategory::create(['name' => 'Coffee beans']);
    ($this->makeExpense)(['amount' => 300000]);
    ($this->makeExpense)(['amount' => 200000]);
    ($this->makeExpense)(['amount' => 50000, 'expense_category_id' => $other->id]);
    ($this->makeExpense)(['amount' => 777777, 'incurred_on' => now()->subMonths(2)->toDateString()]);

    $analytics = Mockery::mock(PlatformAnalyticsService::class);
    $analytics->shouldReceive('recurringRevenueForPeriod')->once()->andReturn(15000.0);
    app()->instance(PlatformAnalyticsService::class, $analytics);

    ($this->zeus)()->get(route('zeus.expenses.index', ['month' => now()->format('Y-m')]))
        ->assertInertia(fn ($page) => $page
            ->where('summary.spent', 550000)
            ->where('summary.count', 3)
            ->where('summary.revenue', 15000)
            ->where('summary.net', 9500)
            ->where('summary.by_category.0.name', 'Hosting and infrastructure')
            ->where('summary.by_category.0.total', 500000)
            ->where('summary.by_category.1.name', 'Coffee beans')
        );
});

it('compares the month with the one before, names the biggest expense, and fills every day of the chart', function () {
    $month = now()->startOfMonth();
    ($this->makeExpense)(['payee' => 'Small', 'amount' => 100000, 'incurred_on' => $month->copy()->addDays(2)->toDateString()]);
    ($this->makeExpense)(['payee' => 'Biggest', 'amount' => 700000, 'incurred_on' => $month->copy()->addDays(2)->toDateString()]);
    ($this->makeExpense)(['payee' => 'Last month', 'amount' => 400000, 'incurred_on' => $month->copy()->subMonth()->addDays(4)->toDateString()]);
    $archived = ($this->makeExpense)(['payee' => 'Archived', 'amount' => 999999999, 'incurred_on' => $month->copy()->addDays(5)->toDateString()]);
    $archived->delete();

    ($this->zeus)()->get(route('zeus.expenses.index', ['month' => $month->format('Y-m')]))
        ->assertInertia(fn ($page) => $page
            ->where('summary.previous_spent', 400000)
            ->where('summary.largest.payee', 'Biggest')
            ->where('summary.largest.amount', 700000)
            ->where('summary.series.unit', 'day')
            ->has('summary.series.points', $month->daysInMonth)
            ->where('summary.series.points.2.total', 800000)
            ->where('summary.series.points.0.total', 0)
        );
});

it('charts all time by month, with empty months in between as zero', function () {
    ($this->makeExpense)(['amount' => 100000, 'incurred_on' => '2026-03-10']);
    ($this->makeExpense)(['amount' => 250000, 'incurred_on' => '2026-03-20']);
    ($this->makeExpense)(['amount' => 40000, 'incurred_on' => '2026-06-01']);

    ($this->zeus)()->get(route('zeus.expenses.index', ['month' => 'all']))
        ->assertInertia(fn ($page) => $page
            ->where('summary.series.unit', 'month')
            ->where('summary.series.points', fn ($points) => collect($points)->map(fn ($p) => [$p['key'], $p['total']])->all() === [
                ['2026-03', 350000], ['2026-04', 0], ['2026-05', 0], ['2026-06', 40000],
            ])
            ->where('summary.previous_spent', fn ($v) => $v === null)
        );
});

it('reports spend only, with no revenue or net, for all time', function () {
    ($this->makeExpense)(['amount' => 100000]);
    ($this->makeExpense)(['amount' => 250000, 'incurred_on' => now()->subYear()->toDateString()]);

    ($this->zeus)()->get(route('zeus.expenses.index', ['month' => 'all']))
        ->assertInertia(fn ($page) => $page->where('summary.spent', 350000)->where('summary.revenue', fn ($v) => $v === null)->where('summary.net', fn ($v) => $v === null));
});

it('keeps the shared MRR calculation identical to what the dashboard chart shows', function () {
    $plan = Plan::factory()->create(['price' => 1200000, 'billing_interval' => 'annually']);
    ResidentSubscription::factory()->create([
        'plan_id' => $plan->id,
        'status' => 'active',
        'current_period_end' => now()->addMonths(6),
        'created_at' => now()->subMonth(),
    ]);

    $service = app(PlatformAnalyticsService::class);
    $start = Carbon::now()->startOfMonth();
    $end = Carbon::now()->endOfMonth();

    $direct = $service->recurringRevenueForPeriod($start, $end);
    $chart = $service->getPlatformGrowthChart($start->toDateString(), $start->copy()->addMonths(2)->endOfMonth()->toDateString());

    expect($direct)->toBe(1000.0)->and($chart[0]['mrr'])->toBe($direct);
});

// ---------- Filters and paging ----------

it('filters by month, category and search without treating wildcards as wildcards', function () {
    $other = ExpenseCategory::create(['name' => 'Coffee beans']);
    ($this->makeExpense)(['payee' => 'Alpha', 'note' => '100% real']);
    ($this->makeExpense)(['payee' => 'Beta', 'expense_category_id' => $other->id]);
    ($this->makeExpense)(['payee' => 'Gamma', 'incurred_on' => now()->subMonths(3)->toDateString()]);

    $page = fn (array $query) => ($this->zeus)()->get(route('zeus.expenses.index', $query));

    $page(['month' => now()->format('Y-m'), 'category_id' => $other->id])->assertInertia(fn ($p) => $p->where('summary.count', 1));
    $page(['month' => 'all'])->assertInertia(fn ($p) => $p->where('summary.count', 3));
    $page(['month' => 'all', 'search' => 'Gamma'])->assertInertia(fn ($p) => $p->where('summary.count', 1));
    $page(['month' => 'all', 'search' => '%'])->assertInertia(fn ($p) => $p->where('summary.count', 1));
    $page(['month' => 'not-a-month'])->assertSessionHasErrors('month');
});

it('pages through many expenses on the same day without repeating or skipping one', function () {
    foreach (range(1, 30) as $i) {
        ($this->makeExpense)(['payee' => "Vendor {$i}", 'incurred_on' => now()->toDateString()]);
    }

    $service = app(ExpenseService::class);
    $filters = ['month' => now()->format('Y-m')];
    $first = $service->paginate($filters, 25)->pluck('id');

    $page2 = $service->query($filters)->forPage(2, 25)->pluck('id');

    expect($first)->toHaveCount(25)
        ->and($page2)->toHaveCount(5)
        ->and($first->merge($page2)->unique())->toHaveCount(30);
});

// ---------- Export ----------

it('exports exactly what the filters show, in naira, and defuses spreadsheet formulas', function () {
    ($this->makeExpense)(['payee' => '=HYPERLINK("http://evil")', 'amount' => 123456]);
    ($this->makeExpense)(['payee' => 'Last year', 'incurred_on' => now()->subYear()->toDateString()]);

    $csv = ($this->zeus)()->get(route('zeus.expenses.export', ['month' => now()->format('Y-m')]))
        ->assertOk()
        ->assertHeader('content-type', 'text/csv; charset=UTF-8')
        ->streamedContent();

    expect($csv)->toContain('Date,Payee,Category,"Amount (NGN)"')
        ->and($csv)->toContain('1234.56')
        ->and($csv)->toContain("\"'=HYPERLINK")
        ->and($csv)->not->toContain('Last year');
});

// ---------- Receipts ----------

it('serves a receipt only to Zeus, inline and without sniffing', function () {
    Storage::disk('local')->put('expenses/receipts/2026/10/a.pdf', '%PDF-1.4 test');
    $receipt = ($this->makeExpense)()->receipts()->create([
        'path' => 'expenses/receipts/2026/10/a.pdf', 'original_name' => 'slip.pdf', 'mime' => 'application/pdf', 'size' => 13,
    ]);

    $this->get(route('zeus.expenses.receipts.show', $receipt))->assertRedirect(route('zeus.login'));

    ($this->zeus)()->get(route('zeus.expenses.receipts.show', $receipt))
        ->assertOk()
        ->assertHeader('X-Content-Type-Options', 'nosniff')
        ->assertHeader('Content-Type', 'application/pdf');
});

it('lets Zeus download a receipt as an attachment, and only Zeus', function () {
    Storage::disk('local')->put('expenses/receipts/2026/10/c.pdf', '%PDF-1.4 download');
    $receipt = ($this->makeExpense)()->receipts()->create([
        'path' => 'expenses/receipts/2026/10/c.pdf', 'original_name' => 'october "fuel".pdf', 'mime' => 'application/pdf', 'size' => 17,
    ]);

    $this->get(route('zeus.expenses.receipts.show', ['receipt' => $receipt, 'download' => 1]))->assertRedirect(route('zeus.login'));

    $response = ($this->zeus)()->get(route('zeus.expenses.receipts.show', ['receipt' => $receipt, 'download' => 1]))->assertOk();
    expect($response->headers->get('Content-Disposition'))->toStartWith('attachment;')->toContain('october \\"fuel\\".pdf');

    // Without the flag it is still shown inline.
    expect(($this->zeus)()->get(route('zeus.expenses.receipts.show', $receipt))->headers->get('Content-Disposition'))->toStartWith('inline;');
});

it('gives every receipt a view link and a download link in the list', function () {
    $receipt = ($this->makeExpense)()->receipts()->create([
        'path' => 'expenses/receipts/2026/10/d.pdf', 'original_name' => 'd.pdf', 'mime' => 'application/pdf', 'size' => 1,
    ]);

    ($this->zeus)()->get(route('zeus.expenses.index'))
        ->assertInertia(fn ($page) => $page
            ->where('expenses.data.0.receipts.0.url', route('zeus.expenses.receipts.show', $receipt))
            ->where('expenses.data.0.receipts.0.download_url', route('zeus.expenses.receipts.show', ['receipt' => $receipt, 'download' => 1]))
        );
});

it('removes a receipt from an expense without deleting its file', function () {
    Storage::disk('local')->put('expenses/receipts/2026/10/b.pdf', 'x');
    $receipt = ($this->makeExpense)()->receipts()->create([
        'path' => 'expenses/receipts/2026/10/b.pdf', 'original_name' => 'b.pdf', 'mime' => 'application/pdf', 'size' => 1,
    ]);

    ($this->zeus)()->delete(route('zeus.expenses.receipts.destroy', $receipt))->assertSessionHasNoErrors();

    expect(ExpenseReceipt::count())->toBe(0)->and(ExpenseReceipt::withTrashed()->count())->toBe(1);
    Storage::disk('local')->assertExists('expenses/receipts/2026/10/b.pdf');
    ($this->zeus)()->get(route('zeus.expenses.receipts.show', $receipt->id))->assertNotFound();
});

// ---------- Categories ----------

it('adds, renames and archives categories, and archived ones keep naming their old expenses', function () {
    ($this->zeus)()->post(route('zeus.expenses.categories.store'), ['name' => 'Coffee'])->assertSessionHasNoErrors();
    $coffee = ExpenseCategory::where('name', 'Coffee')->first();
    expect($coffee)->not->toBeNull();

    ($this->zeus)()->put(route('zeus.expenses.categories.update', $coffee), ['name' => 'Office coffee'])->assertSessionHasNoErrors();
    expect($coffee->fresh()->name)->toBe('Office coffee');

    $expense = ($this->makeExpense)(['expense_category_id' => $coffee->id]);
    ($this->zeus)()->delete(route('zeus.expenses.categories.destroy', $coffee))->assertSessionHasNoErrors();

    expect(ExpenseCategory::count())->toBeLessThan(ExpenseCategory::withTrashed()->count())
        ->and($expense->fresh()->category->name)->toBe('Office coffee');

    ($this->zeus)()->get(route('zeus.expenses.index'))
        ->assertInertia(fn ($page) => $page->where('categories', fn ($list) => ! collect($list)->pluck('name')->contains('Office coffee')));
});

it('refuses duplicate category names, including archived ones', function () {
    ($this->zeus)()->post(route('zeus.expenses.categories.store'), ['name' => $this->category->name])->assertSessionHasErrors('name');

    $archived = ExpenseCategory::create(['name' => 'Retired']);
    $archived->delete();
    ($this->zeus)()->post(route('zeus.expenses.categories.store'), ['name' => 'Retired'])->assertSessionHasErrors('name');
});

it('starts with sensible default categories', function () {
    expect(ExpenseCategory::query()->pluck('name')->all())->toContain('Hosting and infrastructure', 'SMS and email', 'Payment fees', 'Taxes', 'Other');
});

// ---------- Cloudinary: the default disk ----------

/** A stand-in for Cloudinary that records what was sent, so no test ever touches the real account. */
function fakeCloudinary(): object
{
    $fake = new class implements CloudReceiptClient
    {
        /** @var array<int, array{path: string, publicId: string, resourceType: string}> */
        public array $uploads = [];

        /** @var array<string, string> */
        public array $files = [];

        public int $fetches = 0;

        public function upload(string $localPath, string $publicId, string $resourceType): string
        {
            $this->uploads[] = ['path' => $localPath, 'publicId' => $publicId, 'resourceType' => $resourceType];
            $this->files[$publicId] = (string) file_get_contents($localPath);

            return $publicId;
        }

        public function fetch(string $publicId, string $resourceType): string
        {
            $this->fetches++;

            return $this->files[$publicId] ?? throw new RuntimeException('missing');
        }
    };

    app()->instance(CloudReceiptClient::class, $fake);

    return $fake;
}

it('sends new receipts to Cloudinary when it is the default disk, PDFs as raw files, and writes nothing locally', function () {
    config(['filesystems.default' => 'cloudinary']);
    $cloud = fakeCloudinary();

    ($this->zeus)()->post(route('zeus.expenses.store'), ($this->payload)(['receipts' => [
        UploadedFile::fake()->create('invoice.pdf', 40, 'application/pdf'),
        UploadedFile::fake()->image('slip.png', 100, 100),
    ]]))->assertSessionHasNoErrors();

    expect($cloud->uploads)->toHaveCount(2)
        ->and($cloud->uploads[0]['resourceType'])->toBe('raw')
        ->and($cloud->uploads[0]['publicId'])->toStartWith('kontrol/expenses/receipts/')->toEndWith('.pdf')->not->toContain('invoice')
        ->and($cloud->uploads[1]['resourceType'])->toBe('image')
        ->and($cloud->uploads[1]['publicId'])->not->toContain('slip');

    $receipts = Expense::first()->receipts;
    expect($receipts->pluck('disk')->unique()->all())->toBe(['cloudinary'])
        ->and($receipts->pluck('resource_type')->all())->toBe(['raw', 'image'])
        ->and(Storage::disk('local')->allFiles())->toBe([]);
});

it('serves and downloads a Cloudinary receipt through Zeus only', function () {
    config(['filesystems.default' => 'cloudinary']);
    $cloud = fakeCloudinary();
    $cloud->files['kontrol/expenses/receipts/2026/10/x.pdf'] = '%PDF-1.4 from the cloud';
    $receipt = ($this->makeExpense)()->receipts()->create([
        'path' => 'kontrol/expenses/receipts/2026/10/x.pdf', 'disk' => 'cloudinary', 'resource_type' => 'raw',
        'original_name' => 'x.pdf', 'mime' => 'application/pdf', 'size' => 23,
    ]);

    $this->get(route('zeus.expenses.receipts.show', $receipt))->assertRedirect(route('zeus.login'));
    expect($cloud->fetches)->toBe(0);

    $view = ($this->zeus)()->get(route('zeus.expenses.receipts.show', $receipt))->assertOk();
    expect($view->getContent())->toBe('%PDF-1.4 from the cloud')
        ->and($view->headers->get('Content-Disposition'))->toStartWith('inline;')
        ->and($view->headers->get('X-Content-Type-Options'))->toBe('nosniff')
        ->and($view->headers->get('Content-Type'))->toBe('application/pdf');

    $download = ($this->zeus)()->get(route('zeus.expenses.receipts.show', ['receipt' => $receipt, 'download' => 1]))->assertOk();
    expect($download->headers->get('Content-Disposition'))->toStartWith('attachment;');
});

it('says so politely when Cloudinary cannot be reached, instead of crashing', function () {
    config(['filesystems.default' => 'cloudinary']);
    fakeCloudinary();
    $receipt = ($this->makeExpense)()->receipts()->create([
        'path' => 'kontrol/expenses/receipts/2026/10/gone.pdf', 'disk' => 'cloudinary', 'resource_type' => 'raw',
        'original_name' => 'gone.pdf', 'mime' => 'application/pdf', 'size' => 1,
    ]);

    ($this->zeus)()->get(route('zeus.expenses.receipts.show', $receipt))->assertStatus(502);
});

it('keeps serving receipts saved on the local disk after the default moves to Cloudinary', function () {
    Storage::disk('local')->put('expenses/receipts/2026/10/old.pdf', '%PDF-1.4 old local');
    $receipt = ($this->makeExpense)()->receipts()->create([
        'path' => 'expenses/receipts/2026/10/old.pdf', 'disk' => 'local',
        'original_name' => 'old.pdf', 'mime' => 'application/pdf', 'size' => 18,
    ]);

    config(['filesystems.default' => 'cloudinary']);
    $cloud = fakeCloudinary();

    ($this->zeus)()->get(route('zeus.expenses.receipts.show', $receipt))->assertOk()->assertHeader('Content-Type', 'application/pdf');
    expect($cloud->fetches)->toBe(0);
});
