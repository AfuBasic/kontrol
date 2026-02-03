<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class EnhanceContentRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'content' => ['required', 'string', 'min:10', 'max:10000'],
            'title' => ['nullable', 'string', 'max:255'],
            'type' => ['nullable', 'string', 'in:estate_board'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'content.required' => 'Content is required to enhance.',
            'content.min' => 'Content must be at least 10 characters.',
            'content.max' => 'Content is too long to enhance.',
        ];
    }
}
