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
            'billing_interval' => ['required', 'in:quarterly,semi-annually,annually'],
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

    /**
     * Get custom validated data including null values for nullable fields.
     */
    public function validated($key = null, $default = null): mixed
    {
        $validated = parent::validated($key, $default);

        // Ensure nullable fields are included even if they're null
        $nullableFields = ['description', 'badge', 'max_residents', 'max_security', 'max_admins'];
        foreach ($nullableFields as $field) {
            if ($this->has($field) && ! isset($validated[$field])) {
                $validated[$field] = $this->input($field);
            }
        }

        return $validated;
    }
}
