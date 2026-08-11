<?php

namespace App\Http\Requests\Incidents;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class StoreIncidentCommentRequest extends FormRequest
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
        $rules = [
            'body' => ['required', 'string', 'min:2', 'max:2000'],
        ];

        if ($this->user()?->contextHasRole('admin')) {
            $rules['parent_id'] = ['nullable', 'integer', 'exists:incident_comments,id'];
        } else {
            $rules['parent_id'] = ['prohibited'];
        }

        return $rules;
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'body.required' => 'Comment body is required.',
            'body.min' => 'Comment must be at least 2 characters.',
            'body.max' => 'Comment cannot exceed 2000 characters.',
        ];
    }
}
