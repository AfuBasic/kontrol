<?php

namespace App\Http\Requests\Zeus;

use App\Services\Zeus\JobHistoryService;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ClearJobHistoryRequest extends FormRequest
{
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
            'scope' => ['required', 'string', Rule::in(JobHistoryService::CLEAR_SCOPES)],
        ];
    }

    public function scope(): string
    {
        return (string) $this->validated('scope');
    }
}
