<?php

namespace App\Http\Requests\EstateBoard;

use App\Enums\EstateBoardPostAudience;
use App\Enums\EstateBoardPostStatus;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StorePostRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'title' => ['nullable', 'string', 'max:255'],
            'body' => ['required', 'string', 'min:10', 'max:10000'],
            'status' => ['required', Rule::enum(EstateBoardPostStatus::class)],
            'audience' => ['required', Rule::enum(EstateBoardPostAudience::class)],
            'images' => ['nullable', 'array', 'max:10'],
            'images.*' => ['image', 'mimes:jpg,jpeg,png,webp', 'max:5120'],
            'idempotency_key' => ['nullable', 'string', 'max:64'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'body.required' => 'Post content is required.',
            'body.min' => 'Post content must be at least 10 characters.',
            'body.max' => 'Post content cannot exceed 10,000 characters.',
            'images.max' => 'You can upload a maximum of 10 images.',
            'images.*.max' => 'Each image must not exceed 5MB.',
            'images.*.mimes' => 'Images must be JPG, PNG, or WebP format.',
        ];
    }
}
