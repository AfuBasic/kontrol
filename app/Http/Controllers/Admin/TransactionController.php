<?php

namespace App\Http\Controllers\Admin;

use App\Enums\PaymentMethod;
use App\Enums\TransactionStatus;
use App\Enums\TransactionType;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\CreateTransactionAdjustmentRequest;
use App\Http\Requests\Admin\IssueRefundRequest;
use App\Http\Requests\Admin\RecordOfflinePaymentRequest;
use App\Models\Collection;
use App\Models\CollectionAssignment;
use App\Models\EstateTransaction;
use App\Models\User;
use App\Services\Admin\CollectionService;
use App\Services\EstateContextService;
use App\Services\Ledger\LedgerService;
use App\Services\Ledger\TransactionExportService;
use App\Services\Ledger\TransactionInsightService;
use App\Services\Ledger\TransactionOverviewService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class TransactionController extends Controller
{
    public function __construct(
        private EstateContextService $estateContext,
        private TransactionOverviewService $overviewService,
        private TransactionInsightService $insightService,
        private TransactionExportService $exportService,
        private LedgerService $ledgerService,
        private CollectionService $collectionService,
    ) {}

    public function index(Request $request): Response
    {
        $this->authorize('transactions.view');

        $estate = $this->estateContext->getEstate();
        setPermissionsTeamId($estate->id);

        $filters = $request->only([
            'search', 'resident_id', 'collection_id', 'type', 'status',
            'payment_method', 'provider', 'coupon', 'created_by', 'approved_by',
            'amount_min', 'amount_max', 'date_from', 'date_to',
        ]);

        $transactions = $this->overviewService
            ->query($estate, $filters)
            ->paginate(20)
            ->withQueryString()
            ->through(fn (EstateTransaction $transaction) => $this->overviewService->formatTransaction($transaction));

        $residents = User::query()
            ->whereHas('estates', fn ($q) => $q->where('estates.id', $estate->id))
            ->orderBy('name')
            ->get(['id', 'name', 'email']);

        $collections = Collection::query()
            ->where('estate_id', $estate->id)
            ->orderBy('name')
            ->get(['id', 'name']);

        return Inertia::render('Admin/Transactions/Index', [
            'hero' => Inertia::defer(fn () => $this->overviewService->heroMetrics($estate)),
            'timeline' => Inertia::defer(fn () => $this->overviewService->timeline($estate)),
            'moneyFlow' => Inertia::defer(fn () => $this->overviewService->moneyFlow($estate)),
            'insights' => Inertia::defer(fn () => Gate::allows('transactions.insights')
                ? $this->insightService->generate($estate)
                : []),
            'transactions' => $transactions,
            'filters' => $filters,
            'filterOptions' => [
                'residents' => $residents,
                'collections' => $collections,
                'types' => collect(TransactionType::cases())->map(fn ($t) => [
                    'value' => $t->value,
                    'label' => $t->label(),
                ]),
                'statuses' => collect(TransactionStatus::cases())->map(fn ($s) => [
                    'value' => $s->value,
                    'label' => $s->label(),
                ]),
                'payment_methods' => collect(PaymentMethod::cases())->map(fn ($m) => [
                    'value' => $m->value,
                    'label' => $m->label(),
                ]),
            ],
            'permissions' => [
                'export' => Gate::allows('transactions.export'),
                'refund' => Gate::allows('transactions.refund'),
                'adjust' => Gate::allows('transactions.adjust'),
                'record_offline' => Gate::allows('transactions.record_offline_payment'),
                'view_receipts' => Gate::allows('transactions.view_receipts'),
                'download_receipts' => Gate::allows('transactions.download_receipts'),
                'audit' => Gate::allows('transactions.audit'),
                'reports' => Gate::allows('transactions.reports'),
            ],
        ]);
    }

    public function show(EstateTransaction $transaction): Response|JsonResponse
    {
        $this->authorize('transactions.view');
        $this->authorizeTransaction($transaction);

        $detail = $this->overviewService->formatDetail($transaction);

        if (request()->wantsJson()) {
            return response()->json(['transaction' => $detail]);
        }

        return Inertia::render('Admin/Transactions/Show', [
            'transaction' => $detail,
        ]);
    }

    public function recordOfflinePayment(RecordOfflinePaymentRequest $request): RedirectResponse
    {
        $this->authorize('transactions.record_offline_payment');

        $assignment = CollectionAssignment::query()->findOrFail($request->validated('assignment_id'));
        $this->authorizeAssignment($assignment);

        $this->collectionService->recordPayment($assignment, [
            'amount' => $request->validated('amount'),
            'method' => $request->validated('method'),
        ]);

        return back()->with('success', 'Offline payment recorded successfully.');
    }

    public function issueRefund(IssueRefundRequest $request, EstateTransaction $transaction): RedirectResponse
    {
        $this->authorize('transactions.refund');
        $this->authorizeTransaction($transaction);

        $this->ledgerService->issueRefund(
            $transaction,
            (int) $request->validated('amount'),
            $request->validated('reason'),
            auth()->user(),
        );

        return back()->with('success', 'Refund issued successfully.');
    }

    public function createAdjustment(CreateTransactionAdjustmentRequest $request, EstateTransaction $transaction): RedirectResponse
    {
        $this->authorize('transactions.adjust');
        $this->authorizeTransaction($transaction);

        $type = TransactionType::from($request->validated('type'));

        $this->ledgerService->recordAdjustment(
            $transaction,
            $type,
            (int) $request->validated('amount'),
            $request->validated('reason'),
            auth()->user(),
        );

        return back()->with('success', 'Adjustment recorded successfully.');
    }

    public function export(Request $request): StreamedResponse
    {
        $this->authorize('transactions.export');

        $estate = $this->estateContext->getEstate();
        $format = $request->query('format', 'csv');
        $filters = $request->only([
            'search', 'resident_id', 'collection_id', 'type', 'status',
            'payment_method', 'provider', 'coupon', 'created_by', 'approved_by',
            'amount_min', 'amount_max', 'date_from', 'date_to',
        ]);

        return match ($format) {
            'excel' => $this->exportService->toExcel($estate, $filters),
            default => $this->exportService->toCsv($estate, $filters),
        };
    }

    private function authorizeTransaction(EstateTransaction $transaction): void
    {
        $estate = $this->estateContext->getEstate();

        abort_if($transaction->estate_id !== $estate->id, 404);
    }

    private function authorizeAssignment(CollectionAssignment $assignment): void
    {
        $estate = $this->estateContext->getEstate();

        abort_if($assignment->estate_id !== $estate->id, 404);
    }
}
