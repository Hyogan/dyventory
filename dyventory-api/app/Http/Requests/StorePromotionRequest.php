<?php

declare(strict_types=1);

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StorePromotionRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'name'                        => ['required', 'string', 'max:255'],
            'type'                        => ['required', 'string', 'in:percentage,fixed_value,bundle'],
            'value'                       => ['required', 'numeric', 'min:0'],
            'starts_at'                   => ['required', 'date'],
            'ends_at'                     => ['required', 'date', 'after:starts_at'],
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
