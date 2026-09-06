<?php

namespace App\Actions\Security;

use App\Models\AccessLog;
use App\Models\EstateOrganization;
use App\Models\QuickEntryAllocation;
use App\Models\User;
use App\Services\Security\CheckpointClaimService;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class RecordQuickEntryAction
{
    /**
     * Record a quick entry access log.
     *
     * @param  array{
     *     tag: string,
     *     organization_id: int,
     *     visitor_name?: string|null,
     *     vehicle_plate_number?: string|null,
     *     vehicle_make?: string|null,
     *     vehicle_model?: string|null,
     *     allocation_id?: int|null,
     *     verified_at?: string|\DateTimeInterface|null,
     *     entry_point?: string|null,
     * }  $data
     */
    public function execute(
        int $estateId,
        User $verifiedBy,
        array $data
    ): AccessLog {
        $timestamp = isset($data['verified_at'])
            ? CarbonImmutable::parse($data['verified_at'])
            : now();

        $entryPoint = $data['entry_point'] ?? app(CheckpointClaimService::class)->getCurrentCheckpoint($estateId, $verifiedBy);
        $tag = strtoupper(trim($data['tag']));

        return DB::transaction(function () use ($estateId, $verifiedBy, $data, $tag, $timestamp, $entryPoint) {
            $organization = EstateOrganization::where('estate_id', $estateId)
                ->where('id', $data['organization_id'])
                ->firstOrFail();

            if (! $organization->is_active || ! $organization->quick_entry_enabled) {
                throw ValidationException::withMessages([
                    'organization_id' => ['Quick entry is currently disabled for this organization.'],
                ]);
            }

            // If an allocation ID was provided, mark tag used on allocation if present
            if (! empty($data['allocation_id'])) {
                $allocation = QuickEntryAllocation::where('estate_id', $estateId)
                    ->where('id', $data['allocation_id'])
                    ->lockForUpdate()
                    ->first();

                if ($allocation) {
                    $allocation->increment('used_count');
                }
            }

            $visitorName = ! empty($data['visitor_name']) ? trim($data['visitor_name']) : null;
            $displayName = $visitorName ?? "Visitor ({$organization->name})";

            $log = AccessLog::create([
                'estate_id' => $estateId,
                'entry_point' => $entryPoint,
                'access_code_id' => null,
                'verified_by' => $verifiedBy->id,
                'verified_at' => $timestamp,
                'vehicle_make' => $data['vehicle_make'] ?? null,
                'vehicle_model' => $data['vehicle_model'] ?? null,
                'vehicle_plate_number' => $data['vehicle_plate_number'] ?? null,
                'meta' => [
                    'entry_type' => 'quick_entry',
                    'tag' => $tag,
                    'organization_id' => $organization->id,
                    'organization_name' => $organization->name,
                    'organization_type' => $organization->type,
                    'visitor_name' => $displayName,
                    'allocation_id' => $data['allocation_id'] ?? null,
                    'entry_point' => $entryPoint,
                ],
            ]);

            activity('access')
                ->causedBy($verifiedBy)
                ->withProperties([
                    'visitor_name' => $displayName,
                    'tag' => $tag,
                    'organization' => $organization->name,
                ])
                ->log("Quick Entry admitted for {$organization->name} (Tag: {$tag})");

            return $log;
        });
    }
}
