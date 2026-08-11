<?php

namespace App\Http\Controllers\Admin;

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
     * Store an official comment on an incident.
     */
    public function store(StoreIncidentCommentRequest $request, Incident $incident): RedirectResponse
    {
        $this->authorize('comment', $incident);

        $this->addCommentAction->execute($incident, $request->validated());

        return back()->with('success', 'Official comment added.');
    }

    /**
     * Moderation: Delete any comment.
     */
    public function destroy(IncidentComment $comment): RedirectResponse
    {
        if (! auth()->user()->contextHasRole('admin')) {
            abort(403, 'Only administrators can moderate comments.');
        }

        $incident = $comment->incident;
        $comment->delete();
        $incident->decrement('comments_count');

        return back()->with('success', 'Comment moderated successfully.');
    }
}
