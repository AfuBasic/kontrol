<?php

namespace App\Actions\Incidents;

use App\Enums\IncidentStatus;
use App\Models\Incident;
use App\Notifications\Incidents\IncidentStatusUpdatedNotification;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class UpdateIncidentStatusAction
{
    /**
     * @param  array{status: string, assigned_to?: int|null}  $data
     */
    public function execute(Incident $incident, array $data): Incident
    {
        return DB::transaction(function () use ($incident, $data) {
            $user = Auth::user();
            $newStatus = IncidentStatus::from($data['status']);

            // Validate status transitions:
            // 1. Cannot transition to Closed (only reporter can close)
            // 2. Cannot change status if already Closed
            if ($newStatus === IncidentStatus::Closed) {
                throw new \InvalidArgumentException('Only the reporter can close this incident.');
            }

            if ($incident->status === IncidentStatus::Closed) {
                throw new \InvalidArgumentException('This incident is closed and cannot be updated.');
            }

            // 3. Prevent backwards or illegal transitions if necessary
            if ($newStatus !== $incident->status) {
                $expectedStatus = match ($incident->status) {
                    IncidentStatus::Pending => IncidentStatus::Acknowledged,
                    IncidentStatus::Acknowledged => IncidentStatus::Resolving,
                    IncidentStatus::Resolving => IncidentStatus::Solved,
                    default => null,
                };

                if ($expectedStatus === null || $newStatus !== $expectedStatus) {
                    throw new \InvalidArgumentException("Invalid status transition from {$incident->status->value} to {$newStatus->value}.");
                }
            }

            $incident->status = $newStatus;

            // Set timestamps
            if ($newStatus === IncidentStatus::Acknowledged && ! $incident->acknowledged_at) {
                $incident->acknowledged_at = now();
            } elseif ($newStatus === IncidentStatus::Resolving) {
                if (! $incident->acknowledged_at) {
                    $incident->acknowledged_at = now();
                }
                if (! $incident->resolving_at) {
                    $incident->resolving_at = now();
                }
            } elseif ($newStatus === IncidentStatus::Solved) {
                if (! $incident->acknowledged_at) {
                    $incident->acknowledged_at = now();
                }
                if (! $incident->resolving_at) {
                    $incident->resolving_at = now();
                }
                if (! $incident->solved_at) {
                    $incident->solved_at = now();
                }
            }

            if (array_key_exists('assigned_to', $data)) {
                $incident->assigned_to = $data['assigned_to'];
            }

            $incident->save();

            activity()
                ->performedOn($incident)
                ->causedBy($user)
                ->withProperties(['estate_id' => $incident->estate_id, 'status' => $newStatus->value])
                ->log("updated incident status to: {$newStatus->label()}");

            // Notify the reporter
            if ($incident->reporter) {
                $incident->reporter->notify(new IncidentStatusUpdatedNotification($incident));
            }

            return $incident;
        });
    }
}
