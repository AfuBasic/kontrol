<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\SecurityEvent;
use App\Services\Admin\SuspiciousActivityService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class SuspiciousActivityController extends Controller
{
    public function __construct(protected SuspiciousActivityService $suspiciousActivity) {}

    public function index(Request $request): Response
    {
        $this->authorize('viewAny', SecurityEvent::class);

        $filters = $request->only(['search', 'attention']);

        $events = $this->suspiciousActivity->paginate($filters);

        $selected = null;
        if ($request->filled('event')) {
            $event = SecurityEvent::query()->where('ulid', $request->string('event'))->first();
            if ($event && $request->user()?->can('view', $event)) {
                $selected = $this->suspiciousActivity->details($event);
            }
        }

        return Inertia::render('Admin/SuspiciousActivity/Index', [
            'events' => $events,
            'filters' => [
                'search' => $filters['search'] ?? '',
                'attention' => $filters['attention'] ?? 'all',
            ],
            'selected' => $selected,
        ]);
    }

    public function show(Request $request, SecurityEvent $event): Response|RedirectResponse
    {
        $this->authorize('view', $event);

        return redirect()->route('admin.suspicious-activity.index', [
            'event' => $event->ulid,
            ...$request->only(['search', 'attention']),
        ]);
    }

    public function review(Request $request, SecurityEvent $event): RedirectResponse
    {
        $this->authorize('review', $event);

        if ($event->reviewed_at === null) {
            $event->forceFill([
                'reviewed_at' => now(),
                'reviewed_by' => $request->user()?->id,
            ])->save();
        }

        return back();
    }
}
