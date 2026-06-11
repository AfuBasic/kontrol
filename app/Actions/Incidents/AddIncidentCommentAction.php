<?php

namespace App\Actions\Incidents;

use App\Models\Incident;
use App\Models\IncidentComment;
use App\Models\IncidentUpvote;
use App\Models\User;
use App\Notifications\Incidents\IncidentCommentNotification;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Notification;

class AddIncidentCommentAction
{
    /**
     * @param  array{body: string, parent_id?: int|null}  $data
     */
    public function execute(Incident $incident, array $data): IncidentComment
    {
        return DB::transaction(function () use ($incident, $data) {
            $user = Auth::user();

            setPermissionsTeamId($incident->estate_id);
            $isOfficial = $user->hasRole('admin');

            $comment = IncidentComment::create([
                'incident_id' => $incident->id,
                'user_id' => $user->id,
                'body' => $data['body'],
                'is_official' => $isOfficial,
                'parent_id' => $data['parent_id'] ?? null,
            ]);

            $incident->increment('comments_count');

            activity()
                ->performedOn($incident)
                ->causedBy($user)
                ->withProperties(['estate_id' => $incident->estate_id, 'comment_id' => $comment->id])
                ->log('added comment to incident');

            // Fetch admins of this estate
            $adminIds = User::forEstate($incident->estate_id)
                ->active()
                ->get()
                ->filter(function ($u) use ($incident) {
                    setPermissionsTeamId($incident->estate_id);

                    return $u->hasRole('admin');
                })
                ->pluck('id')
                ->toArray();

            // Fetch upvoters of this incident
            $upvoterIds = IncidentUpvote::where('incident_id', $incident->id)
                ->pluck('user_id')
                ->toArray();

            // Fetch commenters on this incident
            $commenterIds = IncidentComment::where('incident_id', $incident->id)
                ->pluck('user_id')
                ->toArray();

            // Notify reporter, upvoters, commenters, and admins, excluding the commenter themselves
            $recipientIds = collect([])
                ->concat($adminIds)
                ->concat($upvoterIds)
                ->concat($commenterIds)
                ->push($incident->reporter_id)
                ->unique()
                ->filter(fn ($id) => $id !== $user->id)
                ->toArray();

            if (! empty($recipientIds)) {
                $recipients = User::whereIn('id', $recipientIds)->get();
                Notification::send($recipients, new IncidentCommentNotification($incident, $comment));
            }

            return $comment->load('author');
        });
    }
}
