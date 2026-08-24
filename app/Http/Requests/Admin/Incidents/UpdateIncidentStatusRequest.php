<?php

namespace App\Http\Requests\Admin\Incidents;

use App\Models\AdministrativeAssignment;
use App\Models\EstateSettings;
use App\Models\Incident;
use App\Services\EstateContextService;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateIncidentStatusRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $incident = $this->route('incident');
        $zoneId = $incident instanceof Incident ? $incident->zone_id : null;
        $estateId = $incident instanceof Incident
            ? $incident->estate_id
            : resolve(EstateContextService::class)->getEstateId();
        $categoryValues = collect(EstateSettings::resolveCategoriesForEstate($estateId))
            ->pluck('value')
            ->filter()
            ->values()
            ->all();

        return [
            'status' => ['nullable', Rule::in(['pending', 'acknowledged', 'resolving', 'solved', 'closed'])],
            'resolution_notes' => ['nullable', 'string', 'max:5000'],
            'assigned_to' => [
                'nullable',
                'integer',
                function (string $attribute, mixed $value, \Closure $fail) use ($estateId, $zoneId): void {
                    if (! $this->assigneeCanHandleIncident((int) $value, $estateId, $zoneId)) {
                        $fail('The selected assignee cannot handle incidents for this estate or zone.');
                    }
                },
            ],
            'priority' => ['nullable', Rule::in(['critical', 'high', 'medium', 'low'])],
            'category' => ['nullable', 'string', Rule::in($categoryValues)],
            'is_private' => ['nullable', 'boolean'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'status.required' => 'Status is required.',
            'status.in' => 'Invalid status option.',
            'category.in' => 'Select a valid incident category.',
        ];
    }

    private function assigneeCanHandleIncident(int $userId, int $estateId, ?int $zoneId): bool
    {
        return AdministrativeAssignment::query()
            ->where('user_id', $userId)
            ->where('estate_id', $estateId)
            ->where('is_active', true)
            ->whereHas('role', fn ($query) => $query->where('name', 'admin'))
            ->where(function ($query) use ($zoneId): void {
                $query->where(function ($estateScope): void {
                    $estateScope->where('scope_type', 'estate')
                        ->whereNull('zone_id');
                });

                if ($zoneId !== null) {
                    $query->orWhere(function ($zoneScope) use ($zoneId): void {
                        $zoneScope->where('scope_type', 'zone')
                            ->where('zone_id', $zoneId);
                    });
                }
            })
            ->exists();
    }
}
