<?php

namespace App\Http\Controllers\Zeus;

use App\Http\Controllers\Controller;
use App\Models\Feedback;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class FeedbackController extends Controller
{
    /**
     * Display a paginated listing of user feedbacks with filtering and metrics.
     */
    public function index(Request $request): Response
    {
        $status = $request->string('status')->toString() ?: 'all';
        $category = $request->string('category')->toString() ?: 'all';
        $search = $request->string('search')->toString();

        $query = Feedback::query()
            ->with(['user', 'estate', 'impersonator'])
            ->when($status !== 'all', fn ($q) => $q->where('status', $status))
            ->when($category !== 'all', fn ($q) => $q->where('category', $category))
            ->when($search !== '', function ($q) use ($search) {
                $q->where(function ($inner) use ($search) {
                    $inner->where('message', 'like', "%{$search}%")
                        ->orWhereHas('user', fn ($u) => $u->where('name', 'like', "%{$search}%")->orWhere('email', 'like', "%{$search}%"))
                        ->orWhereHas('estate', fn ($e) => $e->where('name', 'like', "%{$search}%"));
                });
            })
            ->orderByDesc('created_at');

        $feedbacks = $query->paginate(20)
            ->withQueryString()
            ->through(fn (Feedback $fb) => [
                'id' => $fb->id,
                'ulid' => $fb->ulid,
                'category' => $fb->category,
                'message' => $fb->message,
                'status' => $fb->status,
                'source' => $fb->source,
                'platform' => $fb->platform,
                'app_version' => $fb->app_version,
                'route_or_screen' => $fb->route_or_screen,
                'role_context' => $fb->role_context,
                'support_mode' => (bool) $fb->support_mode,
                'user' => $fb->user ? [
                    'id' => $fb->user->id,
                    'name' => $fb->user->name,
                    'email' => $fb->user->email,
                ] : null,
                'estate' => $fb->estate ? [
                    'id' => $fb->estate->id,
                    'name' => $fb->estate->name,
                ] : null,
                'impersonator' => $fb->impersonator ? [
                    'id' => $fb->impersonator->id,
                    'name' => $fb->impersonator->name,
                ] : null,
                'created_at' => $fb->created_at->toIso8601String(),
                'created_at_human' => $fb->created_at->diffForHumans(),
            ]);

        // Aggregate counts
        $counts = [
            'all' => Feedback::count(),
            'new' => Feedback::where('status', 'new')->count(),
            'reviewing' => Feedback::where('status', 'reviewing')->count(),
            'noted' => Feedback::where('status', 'noted')->count(),
            'archived' => Feedback::where('status', 'archived')->count(),
        ];

        return Inertia::render('Zeus/Feedback/Index', [
            'feedbacks' => $feedbacks,
            'filters' => [
                'status' => $status,
                'category' => $category,
                'search' => $search,
            ],
            'counts' => $counts,
        ]);
    }

    /**
     * Update the triage status of a feedback item.
     */
    public function updateStatus(Request $request, Feedback $feedback): RedirectResponse
    {
        $validated = $request->validate([
            'status' => ['required', 'string', Rule::in(['new', 'reviewing', 'noted', 'archived'])],
        ]);

        $feedback->update([
            'status' => $validated['status'],
        ]);

        return back()->with('success', 'Feedback status updated.');
    }
}
