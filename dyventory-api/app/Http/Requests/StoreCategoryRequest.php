<?php

declare(strict_types=1);

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreCategoryRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'name'        => ['required', 'string', 'max:255'],
            'slug'        => ['sometimes', 'nullable', 'string', 'max:255', 'regex:/^[a-z0-9-]+$/', 'unique:categories,slug'],
            'description' => ['sometimes', 'nullable', 'string', 'max:1000'],
            'parent_id'   => ['sometimes', 'nullable', 'integer', 'exists:categories,id'],
            'is_active'   => ['sometimes', 'boolean'],
            'sort_order'  => ['sometimes', 'integer', 'min:0'],
        ];
    }
}
