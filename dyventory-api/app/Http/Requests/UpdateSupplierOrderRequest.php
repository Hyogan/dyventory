<?php

declare(strict_types=1);

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateSupplierOrderRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'expected_at'              => ['sometimes', 'nullable', 'date'],
            'notes'                    => ['sometimes', 'nullable', 'string', 'max:2000'],
            'items'                    => ['sometimes', 'array', 'min:1'],
            'items.*.product_id'       => ['required_with:items', 'integer', 'exists:products,id'],
            'items.*.variant_id'       => ['nullable', 'integer', 'exists:product_variants,id'],
            'items.*.quantity_ordered' => ['required_with:items', 'numeric', 'min:0.001'],
            'items.*.unit_price_ht'    => ['required_with:items', 'numeric', 'min:0'],
        ];
    }
}
