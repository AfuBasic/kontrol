<?php

namespace App\Actions\Incidents;

use App\Models\Incident;
use App\Models\IncidentComment;
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

            // Send notification to reporter and any users who have commented on this incident, excluding the commenter themselves
            $recipientIds = IncidentComment::where('incident_id', $incident->id)
                ->pluck('user_id')
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
