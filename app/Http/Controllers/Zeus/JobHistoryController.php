<?php

namespace App\Http\Controllers\Zeus;

use App\Http\Controllers\Controller;
use App\Http\Requests\Zeus\ClearJobHistoryRequest;
use App\Http\Requests\Zeus\JobHistoryRequest;
use App\Services\Zeus\JobHistoryService;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class JobHistoryController extends Controller
{
    public function __construct(private JobHistoryService $history) {}

    public function index(JobHistoryRequest $request): Response
    {
        $filters = $request->filters();

        return Inertia::render('Zeus/JobHistory/Index', [
            'filters' => $filters,
            // Closures, so the live refresh can ask for just these without paying for the rest. The list is only
            // read on the tab that shows it.
            'runs' => $filters['tab'] === 'runs' ? fn () => $this->history->paginate($filters, $filters['per_page']) : null,
            'overview' => fn () => $this->history->overview($filters['range']),
            'retention_days' => (int) config('queue.history.retention_days'),
            'recording' => (bool) config('queue.history.enabled'),
        ]);
    }

    public function clear(ClearJobHistoryRequest $request): RedirectResponse
    {
        $scope = $request->scope();
        $deleted = $this->history->clear($scope);

        activity('zeus')
            ->withProperties(['actor' => 'zeus', 'scope' => $scope, 'deleted' => $deleted])
            ->log('Job history cleared');

        return back()->with('success', $deleted === 0
            ? 'There was nothing to clear.'
            : 'Cleared '.number_format($deleted).($deleted === 1 ? ' run' : ' runs').' from the job history.');
    }
}
