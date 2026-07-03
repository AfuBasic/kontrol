<?php

namespace App\Http\Requests;

use App\Enums\EstateBoardPostAudience;
use App\Enums\EstateBoardPostCategory;
use App\Enums\EstateBoardPostPriority;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class EnhanceContentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'mode' => ['nullable', 'string', Rule::in(['enhance', 'draft'])],
            'content' => ['required_if:mode,enhance', 'nullable', 'string', 'min:10', 'max:10000'],
            'brief' => ['required_if:mode,draft', 'nullable', 'string', 'min:10', 'max:2000'],
            'title' => ['nullable', 'string', 'max:255'],
            'category' => ['nullable', Rule::enum(EstateBoardPostCategory::class)],
            'priority' => ['nullable', Rule::enum(EstateBoardPostPriority::class)],
            'audience' => ['nullable', Rule::enum(EstateBoardPostAudience::class)],
            'type' => ['nullable', 'string', 'in:estate_board'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'content.required_if' => 'Content is required to enhance.',
            'content.min' => 'Content must be at least 10 characters.',
            'content.max' => 'Content is too long to enhance.',
            'brief.required_if' => 'Please describe what you want to announce.',
            'brief.min' => 'Your description must be at least 10 characters.',
            'brief.max' => 'Your description is too long.',
        ];
    }

    protected function prepareForValidation(): void
    {
        if (! $this->has('mode')) {
            $this->merge(['mode' => 'enhance']);
        }
    }
}
