<?php

namespace App\Http\Requests\EstateBoard;

use App\Enums\EstateBoardPostAudience;
use App\Enums\EstateBoardPostCategory;
use App\Enums\EstateBoardPostPriority;
use App\Enums\EstateBoardPostStatus;
use App\Services\EstateContextService;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdatePostRequest extends FormRequest
{
    use ConstrainsZoneScopedPostTargeting;

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
            'title' => ['nullable', 'string', 'max:255'],
            'body' => ['required', 'string', 'min:10', 'max:10000'],
            'category' => ['required', Rule::enum(EstateBoardPostCategory::class)],
            'priority' => ['required', Rule::enum(EstateBoardPostPriority::class)],
            'status' => ['required', Rule::enum(EstateBoardPostStatus::class)],
            'audience' => ['required', Rule::enum(EstateBoardPostAudience::class)],
            'zone_ids' => ['nullable', 'array'],
            'zone_ids.*' => [
                'integer',
                Rule::exists('zones', 'id')->where('estate_id', resolve(EstateContextService::class)->getEstateId()),
            ],
            'images' => ['nullable', 'array', 'max:10'],
            'images.*' => ['image', 'mimes:jpg,jpeg,png,webp', 'max:5120'],
            'remove_media_ids' => ['nullable', 'array'],
            'remove_media_ids.*' => ['integer', 'exists:estate_board_post_media,id'],
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
        ];
    }
}
