<?php

namespace App\Http\Controllers\Admin;

use App\Actions\Incidents\UpdateIncidentStatusAction;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\Incidents\UpdateIncidentStatusRequest;
use App\Models\Incident;
use Illuminate\Http\RedirectResponse;

class IncidentStatusController extends Controller
{
    public function __construct(
        protected UpdateIncidentStatusAction $updateStatusAction
    ) {}

    /**
     * Update the status/assignee of the specified incident.
     */
    public function update(UpdateIncidentStatusRequest $request, Incident $incident): RedirectResponse
    {
        $this->authorize('updateStatus', $incident);

        $this->updateStatusAction->execute($incident, $request->validated());

        return back()->with('success', 'Incident updated successfully.');
    }
}
