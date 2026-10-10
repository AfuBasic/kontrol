<?php

namespace App\Http\Requests\Zeus;

use App\Models\ExpenseCategory;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ExpenseCategoryRequest extends FormRequest
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
        /** @var ExpenseCategory|null $category */
        $category = $this->route('category');

        return [
            'name' => [
                'required',
                'string',
                'max:80',
                // Archived categories keep their name too, so a new one cannot reuse it.
                Rule::unique('expense_categories', 'name')->ignore($category?->id),
            ],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return ['name.unique' => 'A category with this name already exists (it may be archived).'];
    }
}
