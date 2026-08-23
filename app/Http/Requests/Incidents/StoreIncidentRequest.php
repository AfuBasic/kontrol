<?php

namespace App\Http\Requests\Incidents;

use App\Auth\ContextManager;
use App\Enums\IncidentPriority;
use App\Models\AdministrativeAssignment;
use App\Models\EstateSettings;
use App\Services\EstateContextService;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreIncidentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        $context = app(ContextManager::class)->current();

        if ($context?->isZoneScoped()) {
            $this->merge([
                'zone_id' => $context->zoneId,
            ]);
        }
    }

    public function rules(): array
    {
        $estateId = resolve(EstateContextService::class)->getEstateId();
        $categoryValues = collect(EstateSettings::resolveCategoriesForEstate($estateId))
            ->pluck('value')
            ->filter()
            ->values()
            ->all();

        return [
            'title' => ['required', 'string', 'min:5', 'max:150'],
            'body' => ['required', 'string', 'min:20', 'max:5000'],
            'category' => ['required', 'string', 'max:100', Rule::in($categoryValues)],
            'priority' => ['nullable', Rule::enum(IncidentPriority::class)],
            'attachment_url' => ['nullable', 'string', 'url'],
            'attachment_type' => ['nullable', 'string', 'in:image,video'],
            'attachment_hash' => ['nullable', 'string'],
            'location' => ['nullable', 'string', 'max:255'],
            'zone_id' => [
                'nullable',
                'integer',
                Rule::exists('zones', 'id')->where('estate_id', $estateId),
            ],
            'is_private' => ['boolean'],
            'assigned_to' => [
                'nullable',
                'integer',
                function (string $attribute, mixed $value, \Closure $fail) use ($estateId): void {
                    if (! $this->assigneeCanHandleIncident((int) $value, $estateId, $this->integer('zone_id') ?: null)) {
                        $fail('The selected assignee cannot handle incidents for this estate or zone.');
                    }
                },
            ],
            'tags' => ['nullable', 'array'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'title.required' => 'Title is required.',
            'title.min' => 'Title must be at least 5 characters.',
            'title.max' => 'Title cannot exceed 150 characters.',
            'body.required' => 'Incident description is required.',
            'body.min' => 'Description must be at least 20 characters.',
            'body.max' => 'Description cannot exceed 5000 characters.',
            'category.required' => 'Category is required.',
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
