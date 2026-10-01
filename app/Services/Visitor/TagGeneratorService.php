<?php

namespace App\Services\Visitor;

use App\Models\AccessLog;
use Illuminate\Support\Collection;

class TagGeneratorService
{
    private const CHARSET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

    /**
     * Generate a unique 4-char tag for an estate, ensuring no collision with active entries.
     */
    public function generateUnique(int $estateId, int $maxAttempts = 10): string
    {
        $activeTags = $this->getActiveTags($estateId);

        for ($attempt = 0; $attempt < $maxAttempts; $attempt++) {
            $tag = $this->generateRandomTag();

            if (! $activeTags->contains($tag)) {
                return $tag;
            }
        }

        // Fallback: append a numeric suffix if all 4-char combos are exhausted
        $suffix = 1;
        do {
            $candidate = substr($tag, 0, 3).$suffix;
            $suffix++;
        } while ($activeTags->contains($candidate));

        return $candidate;
    }

    /**
     * Whether a tag is held by a quick entry visitor who has not checked out yet.
     */
    public function isInUse(int $estateId, string $tag): bool
    {
        return $this->getActiveTags($estateId)->contains(strtoupper(trim($tag)));
    }

    /**
     * Get all currently active (unchecked-out) tags for an estate.
     *
     * @return Collection<int, string>
     */
    private function getActiveTags(int $estateId): Collection
    {
        return AccessLog::withoutGlobalScopes()
            ->where('estate_id', $estateId)
            ->whereNull('access_code_id')
            ->where('meta->entry_type', 'quick_entry')
            ->whereNull('checked_out_at')
            ->get()
            ->map(fn (AccessLog $log) => strtoupper($log->meta['tag'] ?? ''))
            ->filter(fn (string $tag) => $tag !== '');
    }

    /**
     * Generate a random 4-char tag from the safe charset.
     */
    private function generateRandomTag(): string
    {
        $chars = str_split(self::CHARSET);
        $tag = '';
        for ($i = 0; $i < 4; $i++) {
            $tag .= $chars[random_int(0, count($chars) - 1)];
        }

        return $tag;
    }
}
