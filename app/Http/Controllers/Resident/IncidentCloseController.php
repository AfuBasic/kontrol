<?php

namespace App\Http\Controllers\Resident;

use App\Actions\Incidents\CloseIncidentAction;
use App\Http\Controllers\Controller;
use App\Models\Incident;
use Illuminate\Http\RedirectResponse;

class IncidentCloseController extends Controller
{
    public function __construct(
        protected CloseIncidentAction $closeIncidentAction
    ) {}

    /**
     * Close the specified incident (reporter only).
     */
    public function __invoke(Incident $incident): RedirectResponse
    {
        $this->authorize('close', $incident);

        $this->closeIncidentAction->execute($incident);

        return redirect()->route('resident.incidents.show', $incident->hashid)
            ->with('success', 'Incident marked as closed successfully.');
    }
}
