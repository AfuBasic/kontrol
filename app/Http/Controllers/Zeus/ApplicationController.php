<?php

namespace App\Http\Controllers\Zeus;

use App\Actions\Zeus\ApproveEstateApplicationAction;
use App\Http\Controllers\Controller;
use App\Mail\EstateApplicationRejectedMail;
use App\Models\EstateApplication;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;

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

    public function reject(EstateApplication $application, Request $request): RedirectResponse
    {
        if (! $application->isPending() && $application->status !== 'contacted') {
            return redirect()
                ->route('zeus.dashboard')
                ->with('error', 'This application has already been processed.');
        }

        $reason = $request->input('reason', 'Application does not meet our current criteria.');

        $application->markAsRejected();

        // Send rejection email with reason (queued, non-blocking)
        Mail::to($application->email)->send(new EstateApplicationRejectedMail($application, $reason));

        return redirect()
            ->route('zeus.dashboard')
            ->with('success', 'Application rejected and notification sent.');
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
