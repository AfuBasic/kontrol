<?php

namespace App\Http\Requests\Admin;

use App\Auth\ContextManager;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateZoneRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() && $this->user()->contextHasRole('admin');
    }

    public function rules(): array
    {
        $estateId = app(ContextManager::class)->current()?->estateId;
        $zone = $this->route('zone');

        return [
            'name' => [
                'required',
                'string',
                'max:255',
                Rule::unique('zones', 'name')
                    ->where('estate_id', $estateId)
                    ->whereNull('deleted_at')
                    ->ignore($zone?->id),
            ],
            'description' => ['nullable', 'string', 'max:1000'],
            'is_active' => ['nullable', 'boolean'],
        ];
    }
}
