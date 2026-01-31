<?php

namespace App\Http\Requests\Zeus;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateEstateRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, array<int, mixed>>
     */
    public function rules(): array
    {
        $estate = $this->route('estate');

        return [
            'name' => ['required', 'string', 'max:255'],
            'email' => [
                'required',
                'email',
                'max:255',
                Rule::unique('estates', 'email')->ignore($estate->id),
            ],
            'address' => ['nullable', 'string', 'max:500'],
            'status' => ['sometimes', 'in:active,inactive'],
        ];
    }
}
