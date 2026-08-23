<?php

namespace App\Http\Requests\Admin;

use App\Auth\ContextManager;
use App\Models\Zone;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreZoneRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('create', Zone::class) ?? false;
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
