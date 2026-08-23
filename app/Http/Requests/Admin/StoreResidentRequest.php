<?php

namespace App\Http\Requests\Admin;

use App\Auth\ContextManager;
use App\Models\Property;
use App\Models\User;
use App\Services\EstateContextService;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class StoreResidentRequest extends FormRequest
{
    protected function prepareForValidation(): void
    {
        $context = app(ContextManager::class)->current();

        if ($context?->isZoneScoped() && ! $this->filled('zone_id')) {
            $this->merge(['zone_id' => $context->zoneId]);
        }
    }

    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $estateId = resolve(EstateContextService::class)->getEstateId();

        return [
            'name' => ['required', 'string', 'max:255'],
            'email' => [
                'required',
                'email',
                'max:255',
                function ($attribute, $value, $fail) use ($estateId) {
                    if (! $estateId) {
                        return;
                    }
                    $existingUser = User::where('email', strtolower(trim($value)))->first();
                    if ($existingUser) {
                        $isAlreadyResident = DB::table('estate_users_membership')
                            ->where('user_id', $existingUser->id)
                            ->where('estate_id', $estateId)
                            ->whereIn('status', ['accepted', 'active'])
                            ->where(function ($query) {
                                $query->where('relationship_type', 'resident')
                                    ->orWhere(function ($subQuery) {
                                        $subQuery->whereNull('relationship_type')
                                            ->whereExists(function ($roleQuery) {
                                                $roleQuery->select(DB::raw(1))
                                                    ->from('model_has_roles')
                                                    ->join('roles', 'roles.id', '=', 'model_has_roles.role_id')
                                                    ->whereColumn('model_has_roles.model_id', 'estate_users_membership.user_id')
                                                    ->where('model_has_roles.model_type', User::class)
                                                    ->where('roles.name', 'resident');
                                            });
                                    });
                            })
                            ->exists();

                        if ($isAlreadyResident) {
                            $fail('This user is already a resident in this estate.');
                        }
                    }
                },
            ],
            'phone' => ['nullable', 'string', 'max:20'],
            'unit_number' => ['nullable', 'string', 'max:50'],
            'address' => ['nullable', 'string', 'max:500'],
            'property_owner_id' => [
                'nullable',
                'integer',
                Rule::exists('users', 'id'),
                function ($attribute, $value, $fail) {
                    $context = app(ContextManager::class)->current();
                    if (! $context?->isZoneScoped()) {
                        return;
                    }

                    $isInActiveZone = User::query()
                        ->whereKey($value)
                        ->whereHas('estates', function ($query) use ($context) {
                            $query->where('estates.id', $context->estateId)
                                ->where('estate_users_membership.zone_id', $context->zoneId);
                        })
                        ->exists();

                    if (! $isInActiveZone) {
                        $fail('The selected property owner must belong to your authorized zone.');
                    }
                },
            ],
            'property_id' => [
                'nullable',
                'integer',
                Rule::exists('properties', 'id'),
                function ($attribute, $value, $fail) {
                    $context = app(ContextManager::class)->current();
                    if ($context && $context->isZoneScoped()) {
                        $property = Property::withoutZoneIsolation()->find($value);
                        if ($property && $property->zone_id !== $context->zoneId) {
                            $fail('The selected property must belong to your authorized zone.');
                        }
                    }
                },
            ],
            'zone_id' => [
                'nullable',
                'integer',
                Rule::exists('zones', 'id')->where('estate_id', $estateId),
                function ($attribute, $value, $fail) {
                    $context = app(ContextManager::class)->current();
                    if ($context && $context->isZoneScoped() && (int) $value !== $context->zoneId) {
                        $fail('You are only authorized to assign residents to your active zone.');
                    }
                },
            ],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'email.unique' => 'A user with this email already exists.',
        ];
    }
}
