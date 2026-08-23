<?php

namespace App\Http\Requests\Incidents;

use App\Models\Incident;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

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
        $incident = $this->route('incident');
        $incidentId = $incident instanceof Incident ? $incident->id : null;

        $rules = [
            'body' => ['required', 'string', 'min:2', 'max:2000'],
        ];

        if ($this->user()?->contextHasRole('admin')) {
            $rules['parent_id'] = [
                'nullable',
                'integer',
                Rule::exists('incident_comments', 'id')
                    ->where('incident_id', $incidentId)
                    ->whereNull('parent_id'),
            ];
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
