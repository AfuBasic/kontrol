<?php

namespace App\Actions\Incidents;

use App\Models\Incident;
use App\Models\IncidentUpvote;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class ToggleUpvoteAction
{
    /**
     * @return array{upvoted: bool, upvotes_count: int}
     */
    public function execute(Incident $incident): array
    {
        return DB::transaction(function () use ($incident) {
            $user = Auth::user();

            if ($incident->reporter_id === $user->id) {
                throw new \InvalidArgumentException('You cannot upvote your own incident.');
            }

            $upvote = IncidentUpvote::where('incident_id', $incident->id)
                ->where('user_id', $user->id)
                ->first();

            if ($upvote) {
                $upvote->delete();
                $incident->decrement('upvotes_count');
                $upvoted = false;
            } else {
                IncidentUpvote::create([
                    'incident_id' => $incident->id,
                    'user_id' => $user->id,
                ]);
                $incident->increment('upvotes_count');
                $upvoted = true;
            }

            return [
                'upvoted' => $upvoted,
                'upvotes_count' => $incident->upvotes_count,
            ];
        });
    }
}
