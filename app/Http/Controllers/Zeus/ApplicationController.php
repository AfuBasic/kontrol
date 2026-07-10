<?php

namespace App\Http\Controllers\Zeus;

use App\Actions\Zeus\ApproveEstateApplicationAction;
use App\Http\Controllers\Controller;
use App\Mail\EstateApplicationRejectedMail;
use App\Models\ApplicationNote;
use App\Models\ApplicationTimeline;
use App\Models\EstateApplication;
use App\Notifications\Partner\EstateRequestRejectedNotification;
use App\Services\Zeus\ApplicationAnalyticsService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Mail;
use Inertia\Inertia;
use Inertia\Response;

class ApplicationController extends Controller
{
    public function __construct(
        private ApplicationAnalyticsService $analyticsService
    ) {}

    public function index(): Response
    {
        return Inertia::render('Zeus/Applications/Index', [
            'metrics' => $this->analyticsService->getPipelineMetrics(),
            'funnel' => $this->analyticsService->getFunnelData(),
            'groupedApplications' => $this->analyticsService->getGroupedApplications(),
        ]);
    }

    public function show(EstateApplication $application): Response
    {
        $application->load(['partner', 'estate', 'assignedTo', 'notesList', 'timelineEvents']);

        return Inertia::render('Zeus/Applications/Show', [
            'application' => $application,
        ]);
    }

    public function updateStatus(EstateApplication $application, Request $request): RedirectResponse
    {
        $request->validate([
            'status' => 'required|string|in:received,under_review,approved,rejected',
        ]);

        $oldStatus = $application->status;
        $newStatus = $request->input('status');

        $application->update([
            'status' => $newStatus,
            'reviewed_at' => now(),
        ]);

        ApplicationTimeline::create([
            'estate_application_id' => $application->id,
            'creator_name' => config('zeus.username') ?? 'Zeus Admin',
            'event_type' => 'status_changed',
            'description' => "Moved from {$oldStatus} to {$newStatus}",
        ]);

        Cache::forget('zeus.applications.metrics');
        Cache::forget('zeus.applications.funnel');

        return redirect()->back()->with('success', 'Application status updated.');
    }

    public function addNote(EstateApplication $application, Request $request): RedirectResponse
    {
        $request->validate([
            'body' => 'required|string',
        ]);

        ApplicationNote::create([
            'estate_application_id' => $application->id,
            'creator_name' => config('zeus.username') ?? 'Zeus Admin',
            'body' => $request->input('body'),
            'type' => 'note',
        ]);

        ApplicationTimeline::create([
            'estate_application_id' => $application->id,
            'creator_name' => config('zeus.username') ?? 'Zeus Admin',
            'event_type' => 'note_added',
            'description' => 'Added a new internal note.',
        ]);

        return back()->with('success', 'Note added.');
    }

    public function approve(EstateApplication $application, ApproveEstateApplicationAction $action): RedirectResponse
    {
        if (! in_array($application->status, ['received', 'pending', 'under_review', 'info_requested'], true)) {
            return redirect()
                ->route('zeus.applications.index')
                ->with('error', 'This application cannot be approved from its current status.');
        }

        $estate = $action->execute($application);

        Cache::forget('zeus.applications.metrics');
        Cache::forget('zeus.applications.funnel');

        return redirect()
            ->route('zeus.applications.index')
            ->with('success', "Estate '{$estate->name}' created successfully. An invitation has been sent to {$estate->email}.");
    }

    public function reject(EstateApplication $application, Request $request): RedirectResponse
    {
        if (! in_array($application->status, ['received', 'pending', 'under_review', 'info_requested'], true)) {
            return redirect()
                ->route('zeus.applications.index')
                ->with('error', 'This application cannot be rejected from its current status.');
        }

        $reason = $request->input(
            'rejection_reason',
            $request->input('reason', 'Application does not meet our current criteria.'),
        );

        $application->update([
            'rejection_reason' => $reason,
        ]);
        $application->markAsRejected();

        // Partner-sourced applications notify partner members; public applications email the applicant.
        if ($application->isPartnerSourced() && $application->partner) {
            $partnerMembers = $application->partner->members;
            foreach ($partnerMembers as $member) {
                $member->notify(new EstateRequestRejectedNotification($application, $reason));
            }
        } else {
            Mail::to($application->email)->send(new EstateApplicationRejectedMail($application, $reason));
        }

        Cache::forget('zeus.applications.metrics');
        Cache::forget('zeus.applications.funnel');

        return redirect()
            ->route('zeus.applications.index')
            ->with('success', 'Application rejected and notification sent.');
    }

    public function requestInfo(EstateApplication $application, Request $request): RedirectResponse
    {
        if (! in_array($application->status, ['received', 'pending', 'under_review', 'info_requested'], true)) {
            return redirect()
                ->route('zeus.applications.index')
                ->with('error', 'This application cannot request more information from its current status.');
        }

        $validated = $request->validate([
            'info_request_message' => ['required', 'string', 'max:1000'],
        ]);

        $application->update([
            'status' => 'info_requested',
            'info_request_message' => $validated['info_request_message'],
            'reviewed_at' => now(),
        ]);

        ApplicationTimeline::create([
            'estate_application_id' => $application->id,
            'creator_name' => config('zeus.username') ?? 'Zeus Admin',
            'event_type' => 'info_requested',
            'description' => 'Additional information requested from applicant.',
        ]);

        Cache::forget('zeus.applications.metrics');
        Cache::forget('zeus.applications.funnel');

        return redirect()
            ->route('zeus.applications.index')
            ->with('success', 'Information requested from applicant.');
    }

    public function markContacted(EstateApplication $application): RedirectResponse
    {
        $application->markAsContacted();

        ApplicationTimeline::create([
            'estate_application_id' => $application->id,
            'creator_name' => config('zeus.username') ?? 'Zeus Admin',
            'event_type' => 'contacted',
            'description' => 'Marked as contacted / under review.',
        ]);

        Cache::forget('zeus.applications.metrics');
        Cache::forget('zeus.applications.funnel');

        return redirect()
            ->route('zeus.applications.index')
            ->with('success', 'Application marked as contacted.');
    }

    /**
     * Permanently delete an application (including partner soft-deletes).
     */
    public function destroy(EstateApplication $application): RedirectResponse
    {
        $application->forceDelete();

        Cache::forget('zeus.applications.metrics');
        Cache::forget('zeus.applications.funnel');

        return redirect()
            ->route('zeus.applications.index')
            ->with('success', 'Application permanently deleted.');
    }
}
