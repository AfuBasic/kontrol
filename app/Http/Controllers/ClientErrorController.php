<?php

namespace App\Http\Controllers;

use App\Models\SystemErrorLog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ClientErrorController extends Controller
{
    /**
     * Ingest client-side JavaScript / frontend runtime errors.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'message' => ['required', 'string', 'max:2000'],
            'stack' => ['nullable', 'string', 'max:20000'],
            'file' => ['nullable', 'string', 'max:1000'],
            'line' => ['nullable', 'integer'],
            'url' => ['nullable', 'string', 'max:1000'],
            'user_agent' => ['nullable', 'string', 'max:500'],
            'exception_class' => ['nullable', 'string', 'max:255'],
        ]);

        $user = $request->user();

        $context = [
            'url' => $validated['url'] ?? $request->header('Referer') ?? $request->fullUrl(),
            'method' => 'CLIENT_JS',
            'ip' => $request->ip(),
            'user_agent' => $validated['user_agent'] ?? $request->userAgent(),
            'user_id' => $user?->id,
            'user_email' => $user?->email,
            'estate_id' => $user?->current_estate_id ?? session('estate_id') ?? null,
        ];

        SystemErrorLog::record([
            'exception_class' => $validated['exception_class'] ?? 'FrontendRuntimeError',
            'message' => $validated['message'],
            'file' => $validated['file'] ?? ($validated['url'] ?? 'browser'),
            'line' => $validated['line'] ?? null,
            'stack_trace' => $validated['stack'] ?? null,
            'level' => 'error',
        ], 'frontend', $context);

        return response()->json(['status' => 'logged'], 201);
    }
}
