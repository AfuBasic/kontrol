<?php

namespace App\Models;

use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\MassPrunable;
use Illuminate\Database\Eloquent\Model;
use Throwable;

/**
 * @property int $id
 * @property string $fingerprint
 * @property string $source
 * @property string $level
 * @property string|null $exception_class
 * @property string $message
 * @property string|null $file
 * @property int|null $line
 * @property string|null $stack_trace
 * @property array<string, mixed>|null $context
 * @property string $status
 * @property int $occurrences_count
 * @property CarbonImmutable $first_seen_at
 * @property CarbonImmutable $last_seen_at
 * @property CarbonImmutable|null $created_at
 * @property CarbonImmutable|null $updated_at
 */
class SystemErrorLog extends Model
{
    use MassPrunable;

    protected $fillable = [
        'fingerprint',
        'source',
        'level',
        'exception_class',
        'message',
        'file',
        'line',
        'stack_trace',
        'context',
        'status',
        'occurrences_count',
        'first_seen_at',
        'last_seen_at',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'context' => 'array',
            'line' => 'integer',
            'occurrences_count' => 'integer',
            'first_seen_at' => 'datetime',
            'last_seen_at' => 'datetime',
        ];
    }

    /**
     * Determine what records should be pruned.
     * Prune logs after 7 days of inactivity.
     *
     * @return Builder<static>
     */
    public function prunable(): Builder
    {
        return static::where('last_seen_at', '<', now()->subDays(7));
    }

    /**
     * Record a system error log safely.
     *
     * @param  Throwable|array<string, mixed>  $error
     * @param  array<string, mixed>  $context
     */
    public static function record(Throwable|array $error, string $source = 'backend', array $context = []): ?self
    {
        try {
            if ($error instanceof Throwable) {
                $exceptionClass = get_class($error);
                $message = $error->getMessage() ?: '(No exception message)';
                $file = $error->getFile();
                $line = $error->getLine();
                $stackTrace = $error->getTraceAsString();
                $level = 'error';
            } else {
                $exceptionClass = $error['exception_class'] ?? 'ClientError';
                $message = $error['message'] ?? 'Unknown client error';
                $file = $error['file'] ?? null;
                $line = isset($error['line']) ? (int) $error['line'] : null;
                $stackTrace = $error['stack_trace'] ?? ($error['stack'] ?? null);
                $level = $error['level'] ?? 'error';
            }

            $rawKey = $exceptionClass.':'.$file.':'.$line.':'.substr($message, 0, 100);
            $fingerprint = hash('sha256', $rawKey);

            $existing = static::where('fingerprint', $fingerprint)->first();

            if ($existing) {
                $existing->increment('occurrences_count');
                $existing->update([
                    'last_seen_at' => now(),
                    'context' => $context ?: $existing->context,
                    // If previously marked resolved or ignored, re-open on new recurrence
                    'status' => 'unresolved',
                ]);

                return $existing;
            }

            return static::create([
                'fingerprint' => $fingerprint,
                'source' => $source,
                'level' => $level,
                'exception_class' => $exceptionClass,
                'message' => $message,
                'file' => $file,
                'line' => $line,
                'stack_trace' => $stackTrace,
                'context' => $context,
                'status' => 'unresolved',
                'occurrences_count' => 1,
                'first_seen_at' => now(),
                'last_seen_at' => now(),
            ]);
        } catch (Throwable) {
            // Error logging must never break the main request cycle
            return null;
        }
    }
}
