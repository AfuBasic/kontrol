<?php

namespace App\Http\Requests\Zeus;

use Illuminate\Foundation\Http\FormRequest;

class UpdatePlanRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'slug' => ['required', 'string', 'max:255', 'unique:plans,slug,'.$this->route('plan')->id],
            'description' => ['nullable', 'string'],
            'price' => ['required', 'integer', 'min:0'],
            'billing_interval' => ['required', 'in:monthly,annual'],
            'is_featured' => ['boolean'],
            'badge' => ['nullable', 'string', 'max:100'],
            'color' => ['required', 'string', 'max:20'],
            'visibility' => ['required', 'in:public,private'],
            'max_residents' => ['nullable', 'integer', 'min:1'],
            'max_security' => ['nullable', 'integer', 'min:1'],
            'max_admins' => ['nullable', 'integer', 'min:1'],
            'features' => ['nullable', 'array'],
            'features.*' => ['integer', 'exists:features,id'],
        ];
    }
}
