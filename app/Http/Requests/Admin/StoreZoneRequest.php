<?php

namespace App\Http\Requests\Admin;

use App\Auth\ContextManager;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreZoneRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() && ($this->user()->contextHasRole('admin') || $this->user()->hasPermissionTo('zones.create'));
    }

    public function rules(): array
    {
        $estateId = app(ContextManager::class)->current()?->estateId;

        return [
            'name' => [
                'required',
                'string',
                'max:255',
                Rule::unique('zones', 'name')
                    ->where('estate_id', $estateId),
            ],
            'description' => ['nullable', 'string', 'max:1000'],
            'is_active' => ['nullable', 'boolean'],
        ];
    }
}
