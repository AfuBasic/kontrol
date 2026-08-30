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
            'reminder_offset_minutes' => ['required', 'integer', 'min:5', 'max:10080'],
        ]);

        $reminder = $this->reminderService->setReminder(
            $userCode,
            (int) $validated['reminder_offset_minutes'],
            $user
        );

        $offsetMinutes = $reminder->reminder_offset_minutes;
        $offsetText = match (true) {
            $offsetMinutes === 1440 => '24 hours',
            $offsetMinutes === 720  => '12 hours',
            $offsetMinutes === 360  => '6 hours',
            $offsetMinutes === 120  => '2 hours',
            $offsetMinutes === 60   => '1 hour',
            $offsetMinutes >= 60    => round($offsetMinutes / 60, 1) . ' hours',
            default                 => "{$offsetMinutes} minutes",
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
