<?php

namespace App\Http\Controllers\Zeus;

use App\Http\Controllers\Controller;
use App\Models\SystemErrorLog;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ErrorLogController extends Controller
{
    /**
     * Display a paginated listing of system error logs with summary metrics and filters.
     */
    public function index(Request $request): Response
    {
        $status = $request->string('status')->toString() ?: 'all';
        $source = $request->string('source')->toString() ?: 'all';
        $search = $request->string('search')->toString();

        $query = SystemErrorLog::query()
            ->when($status !== 'all', fn ($q) => $q->where('status', $status))
            ->when($source !== 'all', fn ($q) => $q->where('source', $source))
            ->when($search !== '', function ($q) use ($search) {
                $q->where(function ($inner) use ($search) {
                    $inner->where('message', 'like', "%{$search}%")
                        ->orWhere('exception_class', 'like', "%{$search}%")
                        ->orWhere('file', 'like', "%{$search}%");
                });
            })
            ->orderByDesc('last_seen_at');

        $errors = $query->paginate(20)
            ->withQueryString()
            ->through(fn (SystemErrorLog $log) => [
                'id' => $log->id,
                'fingerprint' => $log->fingerprint,
                'source' => $log->source,
                'level' => $log->level,
                'exception_class' => $log->exception_class ?? 'Error',
                'message' => $log->message,
                'file' => $log->file,
                'line' => $log->line,
                'status' => $log->status,
                'occurrences_count' => $log->occurrences_count,
                'first_seen_at' => $log->first_seen_at?->toIso8601String(),
                'last_seen_at' => $log->last_seen_at?->toIso8601String(),
                'last_seen_human' => $log->last_seen_at?->diffForHumans(),
            ]);

        // Aggregate statistics for the metrics header
        $totalUnresolved = SystemErrorLog::where('status', 'unresolved')->count();
        $total24h = SystemErrorLog::where('last_seen_at', '>=', now()->subDay())->count();
        $backendCount = SystemErrorLog::where('source', 'backend')->where('status', 'unresolved')->count();
        $frontendCount = SystemErrorLog::where('source', 'frontend')->where('status', 'unresolved')->count();
        $topRepeater = SystemErrorLog::orderByDesc('occurrences_count')->first(['exception_class', 'occurrences_count', 'message']);

        return Inertia::render('Zeus/ErrorLogs/Index', [
            'errors' => $errors,
            'filters' => [
                'status' => $status,
                'source' => $source,
                'search' => $search,
            ],
            'metrics' => [
                'unresolved_count' => $totalUnresolved,
                'last_24h_count' => $total24h,
                'backend_count' => $backendCount,
                'frontend_count' => $frontendCount,
                'top_repeater_class' => $topRepeater?->exception_class ?? 'None',
                'top_repeater_occurrences' => $topRepeater?->occurrences_count ?? 0,
            ],
        ]);
    }

    /**
     * Display the specified error log with its full stack trace and request context.
     */
    public function show(SystemErrorLog $errorLog): Response
    {
        return Inertia::render('Zeus/ErrorLogs/Show', [
            'error' => [
                'id' => $errorLog->id,
                'fingerprint' => $errorLog->fingerprint,
                'source' => $errorLog->source,
                'level' => $errorLog->level,
                'exception_class' => $errorLog->exception_class ?? 'Error',
                'message' => $errorLog->message,
                'file' => $errorLog->file,
                'line' => $errorLog->line,
                'stack_trace' => $errorLog->stack_trace,
                'context' => $errorLog->context,
                'status' => $errorLog->status,
                'occurrences_count' => $errorLog->occurrences_count,
                'first_seen_at' => $errorLog->first_seen_at?->toIso8601String(),
                'last_seen_at' => $errorLog->last_seen_at?->toIso8601String(),
                'last_seen_human' => $errorLog->last_seen_at?->diffForHumans(),
            ],
        ]);
    }

    /**
     * Mark an error as resolved.
     */
    public function resolve(SystemErrorLog $errorLog): RedirectResponse
    {
        $errorLog->update(['status' => 'resolved']);

        return back()->with('success', 'Error marked as resolved.');
    }

    /**
     * Mark an error as ignored.
     */
    public function ignore(SystemErrorLog $errorLog): RedirectResponse
    {
        $errorLog->update(['status' => 'ignored']);

        return back()->with('success', 'Error marked as ignored.');
    }

    /**
     * Mark an error as unresolved / reopened.
     */
    public function reopen(SystemErrorLog $errorLog): RedirectResponse
    {
        $errorLog->update(['status' => 'unresolved']);

        return back()->with('success', 'Error reopened.');
    }

    /**
     * Delete a single error log record.
     */
    public function destroy(SystemErrorLog $errorLog): RedirectResponse
    {
        $errorLog->delete();

        return redirect()->route('zeus.error-logs.index')->with('success', 'Error record deleted.');
    }

    /**
     * Clear all error logs instantly.
     */
    public function clearAll(): RedirectResponse
    {
        SystemErrorLog::query()->delete();

        return redirect()->route('zeus.error-logs.index')->with('success', 'All system error logs have been cleared.');
    }

    /**
     * Clear only resolved and ignored error logs.
     */
    public function clearResolved(): RedirectResponse
    {
        SystemErrorLog::whereIn('status', ['resolved', 'ignored'])->delete();

        return redirect()->route('zeus.error-logs.index')->with('success', 'Resolved and ignored error logs have been cleared.');
    }
}
