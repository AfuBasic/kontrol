<?php

use App\Models\SystemErrorLog;

it('deduplicates recurring exceptions by fingerprint and increments occurrences count', function () {
    $exception = new RuntimeException('Database connection timeout on query');

    $log1 = SystemErrorLog::record($exception, 'backend', ['url' => 'https://app.test/dashboard']);
    expect($log1)->not->toBeNull()
        ->and($log1->occurrences_count)->toBe(1)
        ->and($log1->status)->toBe('unresolved');

    // Second occurrence with same exception details
    $log2 = SystemErrorLog::record($exception, 'backend', ['url' => 'https://app.test/dashboard']);
    expect($log2->id)->toBe($log1->id)
        ->and($log2->occurrences_count)->toBe(2);

    expect(SystemErrorLog::count())->toBe(1);
});

it('allows zeus authenticated users to list, filter and view error logs', function () {
    $sessionKey = config('zeus.session_key');

    $log = SystemErrorLog::create([
        'fingerprint' => 'test-fingerprint-123',
        'source' => 'backend',
        'level' => 'error',
        'exception_class' => 'QueryException',
        'message' => 'Syntax error in SQL statement',
        'file' => 'app/Services/TestService.php',
        'line' => 42,
        'stack_trace' => '#0 /test/path(42): doSomething()',
        'context' => ['url' => '/api/test', 'method' => 'POST'],
        'status' => 'unresolved',
        'occurrences_count' => 5,
        'first_seen_at' => now(),
        'last_seen_at' => now(),
    ]);

    $this->withSession([$sessionKey => true])
        ->get(route('zeus.error-logs.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('Zeus/ErrorLogs/Index')
            ->has('errors.data', 1)
            ->where('metrics.unresolved_count', 1)
            ->where('metrics.backend_count', 1)
        );

    $this->withSession([$sessionKey => true])
        ->get(route('zeus.error-logs.show', $log->id))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('Zeus/ErrorLogs/Show')
            ->where('error.exception_class', 'QueryException')
            ->where('error.occurrences_count', 5)
        );
});

it('allows zeus to resolve, ignore, reopen, and delete error logs', function () {
    $sessionKey = config('zeus.session_key');

    $log = SystemErrorLog::create([
        'fingerprint' => 'test-fp-actions',
        'source' => 'frontend',
        'level' => 'error',
        'exception_class' => 'ChunkLoadError',
        'message' => 'Failed to load chunk 123',
        'file' => 'resources/js/Pages/Test.tsx',
        'line' => 10,
        'status' => 'unresolved',
        'occurrences_count' => 1,
        'first_seen_at' => now(),
        'last_seen_at' => now(),
    ]);

    // Resolve
    $this->withSession([$sessionKey => true])
        ->patch(route('zeus.error-logs.resolve', $log->id))
        ->assertRedirect();
    expect($log->fresh()->status)->toBe('resolved');

    // Reopen
    $this->withSession([$sessionKey => true])
        ->patch(route('zeus.error-logs.reopen', $log->id))
        ->assertRedirect();
    expect($log->fresh()->status)->toBe('unresolved');

    // Ignore
    $this->withSession([$sessionKey => true])
        ->patch(route('zeus.error-logs.ignore', $log->id))
        ->assertRedirect();
    expect($log->fresh()->status)->toBe('ignored');

    // Delete
    $this->withSession([$sessionKey => true])
        ->delete(route('zeus.error-logs.destroy', $log->id))
        ->assertRedirect(route('zeus.error-logs.index'));
    expect(SystemErrorLog::find($log->id))->toBeNull();
});

it('allows zeus to clear all logs or only resolved ones', function () {
    $sessionKey = config('zeus.session_key');

    SystemErrorLog::create([
        'fingerprint' => 'fp-unresolved',
        'source' => 'backend',
        'level' => 'error',
        'exception_class' => 'Error',
        'message' => 'Unresolved err',
        'status' => 'unresolved',
        'first_seen_at' => now(),
        'last_seen_at' => now(),
    ]);

    SystemErrorLog::create([
        'fingerprint' => 'fp-resolved',
        'source' => 'backend',
        'level' => 'error',
        'exception_class' => 'Error',
        'message' => 'Resolved err',
        'status' => 'resolved',
        'first_seen_at' => now(),
        'last_seen_at' => now(),
    ]);

    // Clear resolved
    $this->withSession([$sessionKey => true])
        ->post(route('zeus.error-logs.clear-resolved'))
        ->assertRedirect(route('zeus.error-logs.index'));

    expect(SystemErrorLog::count())->toBe(1)
        ->and(SystemErrorLog::first()->status)->toBe('unresolved');

    // Clear all
    $this->withSession([$sessionKey => true])
        ->post(route('zeus.error-logs.clear-all'))
        ->assertRedirect(route('zeus.error-logs.index'));

    expect(SystemErrorLog::count())->toBe(0);
});

it('accepts and rate-limits client-side error reporting', function () {
    $response = $this->postJson(route('api.v1.client-errors'), [
        'message' => 'Uncaught TypeError: Cannot read properties of undefined',
        'stack' => 'TypeError: Cannot read properties...',
        'file' => 'https://app.test/assets/app.js',
        'line' => 124,
        'url' => 'https://app.test/resident/visitors',
        'exception_class' => 'TypeError',
    ]);

    $response->assertStatus(201)
        ->assertJson(['status' => 'logged']);

    expect(SystemErrorLog::count())->toBe(1)
        ->and(SystemErrorLog::first()->source)->toBe('frontend')
        ->and(SystemErrorLog::first()->exception_class)->toBe('TypeError');
});
