<?php

namespace App\Http\Requests\Zeus;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class FailedJobIdsRequest extends FormRequest
{
    public const MAX_AT_ONCE = 100;

    public function authorize(): bool
    {
        // Zeus access is enforced by the route group's middleware.
        return true;
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'ids' => ['required', 'array', 'min:1', 'max:'.self::MAX_AT_ONCE],
            'ids.*' => ['required', 'string', 'uuid'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'ids.required' => 'Choose at least one failed job.',
            'ids.max' => 'Choose at most '.self::MAX_AT_ONCE.' failed jobs at a time.',
        ];
    }

    /**
     * @return array<int, string>
     */
    public function uuids(): array
    {
        return array_values(array_unique($this->validated('ids')));
    }
}
