<?php

namespace App\Http\Controllers\Zeus;

use App\Http\Controllers\Controller;
use App\Http\Requests\Zeus\FailedJobIdsRequest;
use App\Http\Requests\Zeus\FailedJobIndexRequest;
use App\Services\Zeus\FailedJobService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class FailedJobController extends Controller
{
    public function __construct(private FailedJobService $failedJobs) {}

    public function index(FailedJobIndexRequest $request): Response
    {
        $filters = $request->filters();

        return Inertia::render('Zeus/FailedJobs/Index', [
            'filters' => $filters,
            // Closures, so the live refresh can ask for just these two without paying for the rest.
            'jobs' => fn () => $this->failedJobs->paginate($filters, $filters['per_page']),
            'overview' => fn () => $this->failedJobs->overview($filters['range']),
            'limits' => ['max_at_once' => FailedJobIdsRequest::MAX_AT_ONCE],
        ]);
    }

    /**
     * Everything about one failed job, including the full error, for the detail view.
     */
    public function show(string $uuid): JsonResponse
    {
        $detail = $this->failedJobs->detail($uuid);

        abort_if($detail === null, 404);

        return response()->json($detail);
    }

    public function retry(FailedJobIdsRequest $request): RedirectResponse
    {
        $result = $this->failedJobs->retry($request->uuids());

        if ($result['retried'] === 0) {
            return back()->with('error', 'Those jobs are no longer in the failed list, so nothing was retried.');
        }

        $message = $result['retried'] === 1 ? 'Put 1 job back on the queue.' : "Put {$result['retried']} jobs back on the queue.";

        return back()->with('success', $message.($result['missing'] > 0 ? " {$result['missing']} could not be found." : ''));
    }

    public function forget(FailedJobIdsRequest $request): RedirectResponse
    {
        $count = $this->failedJobs->forget($request->uuids());

        return back()->with('success', $count === 1 ? 'Removed 1 failed job.' : "Removed {$count} failed jobs.");
    }
}
