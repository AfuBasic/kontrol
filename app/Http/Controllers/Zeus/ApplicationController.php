<?php

namespace App\Http\Controllers\Zeus;

use App\Actions\Zeus\ApproveEstateApplicationAction;
use App\Http\Controllers\Controller;
use App\Models\EstateApplication;
use Illuminate\Http\RedirectResponse;

class ApplicationController extends Controller
{
    public function approve(EstateApplication $application, ApproveEstateApplicationAction $action): RedirectResponse
    {
        if (! $application->isPending() && $application->status !== 'contacted') {
            return redirect()
                ->route('zeus.dashboard')
                ->with('error', 'This application has already been processed.');
        }

        $estate = $action->execute($application);

        return redirect()
            ->route('zeus.dashboard')
            ->with('success', "Estate '{$estate->name}' created successfully. An invitation has been sent to {$estate->email}.");
    }

    public function reject(EstateApplication $application): RedirectResponse
    {
        if (! $application->isPending() && $application->status !== 'contacted') {
            return redirect()
                ->route('zeus.dashboard')
                ->with('error', 'This application has already been processed.');
        }

        $application->markAsRejected();

        return redirect()
            ->route('zeus.dashboard')
            ->with('success', 'Application rejected.');
    }

    public function markContacted(EstateApplication $application): RedirectResponse
    {
        if (! $application->isPending()) {
            return redirect()
                ->route('zeus.dashboard')
                ->with('error', 'This application has already been processed.');
        }

        $application->markAsContacted();

        return redirect()
            ->route('zeus.dashboard')
            ->with('success', 'Application marked as contacted.');
    }
}
