<?php

declare(strict_types=1);

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreBatchRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // Authorization handled in controller via Policy
    }

    public function rules(): array
    {
        return [
            'product_id'       => ['required', 'integer', 'exists:products,id'],
            'variant_id'       => ['nullable', 'integer', 'exists:product_variants,id'],
            'supplier_id'      => ['nullable', 'integer', 'exists:suppliers,id'],
            'batch_number'     => ['nullable', 'string', 'max:100'],
            'received_at'      => ['nullable', 'date'],
            'initial_quantity' => ['required', 'numeric', 'min:0.001'],
            'attributes'       => ['nullable', 'array'],
        ];
    }
}
