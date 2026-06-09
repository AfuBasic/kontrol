<?php

namespace App\Http\Controllers\Resident;

use App\Actions\Incidents\ToggleUpvoteAction;
use App\Http\Controllers\Controller;
use App\Models\Incident;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;

class IncidentUpvoteController extends Controller
{
    public function __construct(
        protected ToggleUpvoteAction $toggleUpvoteAction
    ) {}

    /**
     * Toggle the upvote on an incident.
     */
    public function store(Incident $incident): JsonResponse|RedirectResponse
    {
        $this->authorize('upvote', $incident);

        $result = $this->toggleUpvoteAction->execute($incident);

        if (request()->wantsJson()) {
            return response()->json($result);
        }

        return back()->with('success', $result['upvoted'] ? 'Incident upvoted.' : 'Upvote removed.');
    }
}
