<?php

namespace App\Actions\Incidents;

use App\Auth\ContextManager;
use App\Enums\IncidentStatus;
use App\Models\Incident;
use App\Models\User;
use App\Notifications\Incidents\IncidentStatusUpdatedNotification;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Notification;
use InvalidArgumentException;

class CloseIncidentAction
{
    public function execute(Incident $incident): Incident
    {
        return DB::transaction(function () use ($incident) {
            $user = Auth::user();

            if ($incident->reporter_id !== $user->id) {
                throw new InvalidArgumentException('Only the reporter can close this incident.');
            }

            if ($incident->status !== IncidentStatus::Solved) {
                throw new InvalidArgumentException('Only solved incidents can be closed.');
            }

            $incident->status = IncidentStatus::Closed;
            $incident->closed_at = now();
            $incident->save();

            activity('incidents')
                ->performedOn($incident)
                ->causedBy($user)
                ->withProperties(['estate_id' => $incident->estate_id])
                ->log('closed incident');

            // Notify all admins that the incident is now closed
            $admins = User::forEstate($incident->estate_id)
                ->active()
                ->get()
                ->filter(function ($u) use ($incident) {
                    app(ContextManager::class)->setSystemContext($incident->estate_id);

                    return $u->hasRole('admin');
                });

            if ($admins->isNotEmpty()) {
                Notification::send($admins, new IncidentStatusUpdatedNotification($incident));
            }

            return $incident;
        });
    }
}
