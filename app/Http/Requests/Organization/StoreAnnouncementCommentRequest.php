<?php

namespace App\Http\Requests\Organization;

use App\Models\EstateBoardPost;
use App\Models\EstateOrganization;
use App\Services\OrganizationContextService;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreAnnouncementCommentRequest extends FormRequest
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
        $post = $this->route('post');
        $postId = $post instanceof EstateBoardPost ? $post->id : null;

        /** @var EstateOrganization|null $organization */
        $organization = $this->attributes->get('organization')
            ?? resolve(OrganizationContextService::class)->getOrganization();

        $estateId = $organization?->estate_id ?? $post?->estate_id;

        return [
            'body' => ['required', 'string', 'min:2', 'max:2000'],
            'parent_id' => [
                'nullable',
                'integer',
                Rule::exists('estate_board_comments', 'id')
                    ->where('estate_id', $estateId)
                    ->where('estate_board_post_id', $postId)
                    ->whereNull('parent_id'),
            ],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'body.required' => 'Comment cannot be empty.',
            'body.min' => 'Comment must be at least 2 characters.',
            'body.max' => 'Comment cannot exceed 2,000 characters.',
        ];
    }
}
