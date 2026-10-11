<?php

namespace App\Http\Controllers\Zeus;

use App\Http\Controllers\Controller;
use App\Http\Requests\Zeus\FailedJobIdsRequest;
use App\Services\Zeus\FailedJobService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class FailedJobController extends Controller
{
    public function __construct(private FailedJobService $failedJobs) {}

    public function index(Request $request): Response
    {
        $search = trim($request->string('search')->toString());

        return Inertia::render('Zeus/FailedJobs/Index', [
            'filters' => ['search' => $search !== '' ? $search : null],
            'jobs' => $this->failedJobs->paginate(['search' => $search !== '' ? $search : null]),
            'summary' => $this->failedJobs->summary(),
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
