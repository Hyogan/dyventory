<?php

declare(strict_types=1);

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdatePromotionRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'name'                        => ['sometimes', 'string', 'max:255'],
            'type'                        => ['sometimes', 'string', 'in:percentage,fixed_value,bundle'],
            'value'                       => ['sometimes', 'numeric', 'min:0'],
            'starts_at'                   => ['sometimes', 'date'],
            'ends_at'                     => ['sometimes', 'date', 'after:starts_at'],
            'is_active'                   => ['boolean'],
            'conditions'                  => ['nullable', 'array'],
            'conditions.min_quantity'     => ['nullable', 'numeric', 'min:0'],
            'conditions.category_ids'     => ['nullable', 'array'],
            'conditions.category_ids.*'   => ['integer'],
            'conditions.product_ids'      => ['nullable', 'array'],
            'conditions.product_ids.*'    => ['integer'],
        ];
    }
}
