<?php

namespace App\Http\Controllers\Resident;

use App\Http\Controllers\Controller;
use App\Models\AccessCode;
use App\Services\Resident\AccessCodeService;
use App\Services\Resident\VisitorPassReminderService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class VisitorPassReminderController extends Controller
{
    public function __construct(
        protected VisitorPassReminderService $reminderService,
        protected AccessCodeService $accessCodeService,
    ) {}

    /**
     * Set or update a visit reminder for a scheduled visitor pass.
     */
    public function store(AccessCode $accessCode, Request $request): RedirectResponse|JsonResponse
    {
        $user = $request->user();
        $userCode = $this->accessCodeService->getCode($accessCode->id);

        abort_if(! $userCode, 404);

        $validated = $request->validate([
            'reminder_offset_minutes' => ['required', 'integer', 'in:60,120,360,720,1440'],
        ]);

        $reminder = $this->reminderService->setReminder(
            $userCode,
            (int) $validated['reminder_offset_minutes'],
            $user
        );

        $offsetText = match ($reminder->reminder_offset_minutes) {
            1440 => '24 hours',
            720 => '12 hours',
            360 => '6 hours',
            120 => '2 hours',
            60 => '1 hour',
            default => "{$reminder->reminder_offset_minutes} minutes",
        };

        $visitorName = $userCode->visitor_name ?? 'your visitor';
        $message = "Reminder set. We'll remind you {$offsetText} before {$visitorName}'s visit.";

        if ($request->wantsJson()) {
            return response()->json([
                'success' => true,
                'message' => $message,
                'reminder' => [
                    'id' => $reminder->id,
                    'reminder_offset_minutes' => $reminder->reminder_offset_minutes,
                    'scheduled_for' => $reminder->scheduled_for->toISOString(),
                    'status' => $reminder->status->value,
                ],
            ]);
        }

        return redirect()->back()->with('success', $message);
    }

    /**
     * Remove / cancel a visit reminder.
     */
    public function destroy(AccessCode $accessCode, Request $request): RedirectResponse|JsonResponse
    {
        $user = $request->user();
        $userCode = $this->accessCodeService->getCode($accessCode->id);

        abort_if(! $userCode, 404);

        $this->reminderService->removeReminder($userCode, $user);

        if ($request->wantsJson()) {
            return response()->json([
                'success' => true,
                'message' => 'Visit reminder removed.',
            ]);
        }

        return redirect()->back()->with('success', 'Visit reminder removed.');
    }
}
