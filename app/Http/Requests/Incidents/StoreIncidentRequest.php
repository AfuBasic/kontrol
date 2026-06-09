<?php

namespace App\Http\Requests\Incidents;

use App\Enums\IncidentCategory;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreIncidentRequest extends FormRequest
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
        return [
            'title' => ['required', 'string', 'min:5', 'max:150'],
            'body' => ['required', 'string', 'min:20', 'max:5000'],
            'category' => ['required', Rule::enum(IncidentCategory::class)],
            'attachment' => ['nullable', 'file', 'mimes:jpg,jpeg,png,webp,mp4,mov,ogg,webm', 'max:20480'],
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
            'attachment.max' => 'Attachment must not exceed 20MB.',
            'attachment.mimes' => 'Attachment must be a JPG, PNG, WebP image or MP4, MOV, WebM video.',
        ];
    }
}
