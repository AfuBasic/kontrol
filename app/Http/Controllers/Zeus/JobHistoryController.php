<?php

namespace App\Http\Controllers\Zeus;

use App\Http\Controllers\Controller;
use App\Http\Requests\Zeus\JobHistoryRequest;
use App\Services\Zeus\JobHistoryService;
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
            'runs' => $this->history->paginate($filters),
            'summary' => $this->history->summary(),
            'retention_days' => (int) config('queue.history.retention_days'),
            'recording' => (bool) config('queue.history.enabled'),
        ]);
    }
}
