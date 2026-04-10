<?php

declare(strict_types=1);

namespace App\Http\Requests;

use App\Enums\FieldType;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * Validates the raw schema payload before FieldSchemaService performs
 * the deeper structural validation (duplicate keys, option arrays, etc.).
 *
 * This request handles shape-level rules; FieldSchemaService handles
 * semantic rules (key immutability, min ≤ max, etc.).
 */
class UpdateCategoryFieldSchemaRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'schema'                  => ['required', 'array'],
            'schema.*.key'            => ['required', 'string', 'max:64', 'regex:/^[a-z][a-z0-9_]*$/'],
            'schema.*.label'          => ['required', 'string', 'max:255'],
            'schema.*.label_fr'       => ['required', 'string', 'max:255'],
            'schema.*.type'           => ['required', Rule::enum(FieldType::class)],
            'schema.*.required'       => ['required', 'boolean'],
            'schema.*.applies_to'     => ['required', 'string', Rule::in(['product', 'batch'])],
            'schema.*.options'        => ['sometimes', 'nullable', 'array'],
            'schema.*.options.*'      => ['string', 'max:255'],
            'schema.*.min'            => ['sometimes', 'nullable', 'numeric'],
            'schema.*.max'            => ['sometimes', 'nullable', 'numeric'],
        ];
    }

    public function messages(): array
    {
        return [
            'schema.required'            => 'A schema array is required.',
            'schema.*.key.required'      => 'Every field definition must have a key.',
            'schema.*.key.regex'         => 'Field key must start with a lowercase letter and contain only lowercase letters, digits, and underscores.',
            'schema.*.type.required'     => 'Every field definition must have a type.',
            'schema.*.applies_to.in'     => "applies_to must be 'product' or 'batch'.",
        ];
    }
}
