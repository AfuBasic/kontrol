<?php

namespace App\Services\Zeus;

use App\Models\Expense;
use App\Models\ExpenseCategory;
use Carbon\Carbon;
use Carbon\CarbonImmutable;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\DB;

class ExpenseService
{
    public function __construct(private PlatformAnalyticsService $analytics) {}

    /**
     * The expenses matching the filters, newest first. A tie on date falls back to id so pages never repeat a row.
     *
     * @param  array{month?: string|null, category_id?: int|null, search?: string|null, archived?: bool|null}  $filters
     * @return Builder<Expense>
     */
    public function query(array $filters): Builder
    {
        $month = $this->month($filters['month'] ?? null);

        return Expense::query()
            ->when($filters['archived'] ?? false, fn (Builder $q) => $q->onlyTrashed())
            ->when($month, fn (Builder $q) => $q->whereBetween('incurred_on', [$month->startOfMonth()->toDateString(), $month->endOfMonth()->toDateString()]))
            ->when($filters['category_id'] ?? null, fn (Builder $q, $id) => $q->where('expense_category_id', $id))
            ->when($filters['search'] ?? null, function (Builder $q, string $search) {
                // "!" is the escape character (the same on every database), so a typed % or _ is just text.
                $like = '%'.str_replace(['!', '%', '_'], ['!!', '!%', '!_'], $search).'%';
                $q->where(fn (Builder $w) => $w->whereRaw("payee LIKE ? ESCAPE '!'", [$like])->orWhereRaw("note LIKE ? ESCAPE '!'", [$like]));
            })
            ->orderByDesc('incurred_on')
            ->orderByDesc('id');
    }

    /**
     * @param  array{month?: string|null, category_id?: int|null, search?: string|null, archived?: bool|null}  $filters
     * @return LengthAwarePaginator<int, Expense>
     */
    public function paginate(array $filters, int $perPage = 25): LengthAwarePaginator
    {
        return $this->query($filters)
            ->with(['category', 'receipts'])
            ->paginate($perPage)
            ->withQueryString();
    }

    /**
     * Spend (and, for a single month, recurring revenue and net) for the same filters as the list.
     * Archived expenses never count. Revenue is MRR, read from the one shared calculation.
     *
     * @param  array{month?: string|null, category_id?: int|null, search?: string|null}  $filters
     * @return array{month: string|null, spent: int, count: int, revenue: float|null, net: float|null, by_category: array<int, array{id: int, name: string, total: int, count: int}>}
     */
    public function summary(array $filters): array
    {
        $base = $this->query([...$filters, 'archived' => false]);

        $spent = (int) (clone $base)->toBase()->reorder()->sum('amount');
        $count = (clone $base)->toBase()->reorder()->count();

        $byCategory = (clone $base)->toBase()->reorder()
            ->join('expense_categories', 'expense_categories.id', '=', 'expenses.expense_category_id')
            ->groupBy('expenses.expense_category_id', 'expense_categories.name')
            ->orderByDesc(DB::raw('SUM(expenses.amount)'))
            ->get([
                'expenses.expense_category_id as id',
                'expense_categories.name as name',
                DB::raw('SUM(expenses.amount) as total'),
                DB::raw('COUNT(*) as count'),
            ])
            ->map(fn ($row) => ['id' => (int) $row->id, 'name' => $row->name, 'total' => (int) $row->total, 'count' => (int) $row->count])
            ->all();

        $month = $this->month($filters['month'] ?? null);
        $revenue = $month
            ? $this->analytics->recurringRevenueForPeriod(
                Carbon::instance($month->startOfMonth()),
                Carbon::instance($month->endOfMonth()),
            )
            : null;

        return [
            'month' => $month?->format('Y-m'),
            'spent' => $spent,
            'count' => $count,
            'revenue' => $revenue,
            'net' => $revenue !== null ? round($revenue - $spent / 100, 2) : null,
            'by_category' => $byCategory,
        ];
    }

    /**
     * Active categories for the add/edit form and the filter.
     *
     * @return array<int, array{id: int, name: string}>
     */
    public function categories(): array
    {
        return ExpenseCategory::query()
            ->orderBy('sort_order')
            ->orderBy('name')
            ->get(['id', 'name'])
            ->map(fn (ExpenseCategory $c) => ['id' => $c->id, 'name' => $c->name])
            ->all();
    }

    /**
     * Parse a "Y-m" month, or null for "all time". Anything unparseable is treated as all time.
     */
    public function month(?string $month): ?CarbonImmutable
    {
        if ($month === null || $month === '' || $month === 'all') {
            return null;
        }

        return CarbonImmutable::createFromFormat('!Y-m', $month) ?: null;
    }
}
