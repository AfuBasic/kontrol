<?php

namespace App\Http\Requests\Incidents;

use App\Enums\IncidentCategory;
use App\Enums\IncidentPriority;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreIncidentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'title' => ['required', 'string', 'min:5', 'max:150'],
            'body' => ['required', 'string', 'min:20', 'max:5000'],
            'category' => ['required', Rule::enum(IncidentCategory::class)],
            'priority' => ['nullable', Rule::enum(IncidentPriority::class)],
            'attachment_url' => ['nullable', 'string', 'url'],
            'attachment_type' => ['nullable', 'string', 'in:image,video'],
            'attachment_hash' => ['nullable', 'string'],
            'location' => ['nullable', 'string', 'max:255'],
            'is_private' => ['boolean'],
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
        ];
    }
}
