<?php

namespace App\Http\Requests\Admin;

use App\Auth\ContextManager;
use App\Models\Zone;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateZoneRequest extends FormRequest
{
    public function authorize(): bool
    {
        $zone = $this->route('zone');

        return $zone instanceof Zone && ($this->user()?->can('update', $zone) ?? false);
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
                    ->ignore($zone?->id),
            ],
            'description' => ['nullable', 'string', 'max:1000'],
            'is_active' => ['nullable', 'boolean'],
        ];
    }
}
