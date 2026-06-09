<?php

namespace App\Http\Controllers\Resident;

use App\Actions\Incidents\AddIncidentCommentAction;
use App\Http\Controllers\Controller;
use App\Http\Requests\Incidents\StoreIncidentCommentRequest;
use App\Models\Incident;
use App\Models\IncidentComment;
use Illuminate\Http\RedirectResponse;

class IncidentCommentController extends Controller
{
    public function __construct(
        protected AddIncidentCommentAction $addCommentAction
    ) {}

    /**
     * Store a comment on an incident.
     */
    public function store(StoreIncidentCommentRequest $request, Incident $incident): RedirectResponse
    {
        $this->authorize('comment', $incident);

        $this->addCommentAction->execute($incident, $request->validated());

        return back()->with('success', 'Comment added successfully.');
    }

    /**
     * Remove the specified comment.
     */
    public function destroy(IncidentComment $comment): RedirectResponse
    {
        if ($comment->user_id !== auth()->id()) {
            abort(403, 'Unauthorized action.');
        }

        $incident = $comment->incident;
        $comment->delete();
        $incident->decrement('comments_count');

        return back()->with('success', 'Comment deleted successfully.');
    }
}
