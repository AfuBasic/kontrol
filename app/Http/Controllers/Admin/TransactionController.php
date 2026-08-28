<?php

namespace App\Http\Controllers\Admin;

use App\Auth\ContextManager;
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
use App\Models\EstateTransactionAudit;
use App\Models\User;
use App\Services\Admin\CollectionService;
use App\Services\EstateContextService;
use App\Services\Ledger\LedgerService;
use App\Services\Ledger\TransactionExportService;
use App\Services\Ledger\TransactionOverviewService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;
use PdfStudio\Laravel\Facades\Pdf;
use Symfony\Component\HttpFoundation\StreamedResponse;

class TransactionController extends Controller
{
    public function __construct(
        private EstateContextService $estateContext,
        private TransactionOverviewService $overviewService,
        private TransactionExportService $exportService,
        private LedgerService $ledgerService,
        private CollectionService $collectionService,
    ) {}

    public function index(Request $request): Response
    {
        $this->authorize('transactions.view');

        $estate = $this->estateContext->getEstate();
        $context = app(ContextManager::class)->current();
        app(ContextManager::class)->setSystemContext($estate->id);

        $this->ledgerService->ensureEstateLedgerSynced($estate);

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

        $admins = User::query()
            ->whereHas('estates', fn ($q) => $q->where('estates.id', $estate->id))
            ->whereHas('roles', fn ($q) => $q->where('name', 'admin'))
            ->orderBy('name')
            ->get(['id', 'name']);

        $recordableAssignments = CollectionAssignment::query()
            ->where('estate_id', $estate->id)
            ->when($context?->isZoneScoped(), fn ($query) => $query->where(function ($scopeQuery) use ($context, $estate) {
                $scopeQuery
                    ->whereHas('property', fn ($propertyQuery) => $propertyQuery
                        ->where('estate_id', $estate->id)
                        ->where('zone_id', $context->zoneId))
                    ->orWhereHas('user.estates', fn ($estateQuery) => $estateQuery
                        ->where('estates.id', $estate->id)
                        ->where('estate_users_membership.zone_id', $context->zoneId));
            }))
            ->whereIn('status', ['pending', 'overdue', 'grace', 'partial'])
            ->whereColumn('amount_due', '>', 'amount_paid')
            ->with(['user:id,name', 'collection:id,name'])
            ->orderBy('due_date')
            ->get()
            ->map(fn (CollectionAssignment $assignment) => [
                'id' => $assignment->id,
                'resident_name' => $assignment->user?->name,
                'collection_name' => $assignment->collection?->name,
                'remaining' => $assignment->amount_due - $assignment->amount_paid,
            ]);

        $audits = EstateTransactionAudit::query()
            ->whereHas('transaction', fn ($q) => $q->where('estate_id', $estate->id))
            ->with(['user:id,name,email', 'transaction:id,ulid,reference_number'])
            ->latest()
            ->paginate(30)
            ->through(fn ($audit) => [
                'id' => $audit->id,
                'action' => $audit->action,
                'reason' => $audit->reason,
                'user_name' => $audit->user?->name ?? 'System',
                'reference_number' => $audit->transaction?->reference_number,
                'transaction_ulid' => $audit->transaction?->ulid,
                'created_at' => $audit->created_at?->toIso8601String(),
                'ip_address' => $audit->transaction?->metadata['ip_address'] ?? $request->ip() ?? '127.0.0.1',
                'user_agent' => $audit->transaction?->metadata['user_agent'] ?? $request->userAgent() ?? 'Chrome / Mac',
            ]);

        $maxTransactionAmount = EstateTransaction::where('estate_id', $estate->id)->max('amount') ?? 100000;
        $maxAmountNaira = (int) ceil($maxTransactionAmount / 100);

        return Inertia::render('Admin/Transactions/Index', [
            'maxAmountLimit' => $maxAmountNaira,
            'todaySummary' => Inertia::defer(fn () => $this->overviewService->todaySummary($estate)),
            'activity' => Inertia::defer(fn () => $this->overviewService->timeline($estate, $filters)),
            'charts' => Inertia::defer(fn () => Gate::allows('transactions.reports')
                ? $this->overviewService->charts($estate)
                : null),
            'audits' => Inertia::defer(fn () => $audits),
            'hasTransactions' => $this->overviewService->hasTransactions($estate),
            'recordableAssignments' => $recordableAssignments,
            'transactions' => $transactions,
            'filters' => (object) $filters,
            'filterOptions' => [
                'residents' => $residents,
                'collections' => $collections,
                'types' => collect(TransactionType::cases())
                    ->reject(fn ($t) => $t === TransactionType::SubscriptionPayment)
                    ->values()
                    ->map(fn ($t) => [
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
                'admins' => $admins,
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

        abort_if(
            ! $this->overviewService->hasTransactions($estate),
            422,
            'No transactions to export.'
        );

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

    public function downloadReceipt(EstateTransaction $transaction): \Illuminate\Http\Response
    {
        $this->authorize('transactions.download_receipts');
        $this->authorizeTransaction($transaction);

        abort_if(
            $transaction->status === TransactionStatus::Pending,
            403,
            'Receipts cannot be downloaded for pending transactions.'
        );

        $detail = $this->overviewService->formatDetail($transaction);
        $estate = $this->estateContext->getEstate();

        return Pdf::view('pdf.receipt')
            ->data([
                'transaction' => $detail,
                'estate' => $estate,
            ])
            ->download("receipt-{$transaction->reference_number}.pdf");
    }

    private function authorizeTransaction(EstateTransaction $transaction): void
    {
        $estate = $this->estateContext->getEstate();

        abort_if($transaction->estate_id !== $estate->id, 404);
    }

    private function authorizeAssignment(CollectionAssignment $assignment): void
    {
        $estate = $this->estateContext->getEstate();
        $context = app(ContextManager::class)->current();

        abort_if($assignment->estate_id !== $estate->id, 404);
        abort_if($context && ! $context->canAccess($assignment), 404);
    }
}
