<?php

namespace App\Http\Requests\EstateBoard;

use App\Models\EstateBoardPost;
use App\Services\EstateContextService;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreCommentRequest extends FormRequest
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

        return [
            'body' => ['required', 'string', 'min:2', 'max:2000'],
            'parent_id' => [
                'nullable',
                'integer',
                Rule::exists('estate_board_comments', 'id')
                    ->where('estate_id', resolve(EstateContextService::class)->getEstateId())
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
