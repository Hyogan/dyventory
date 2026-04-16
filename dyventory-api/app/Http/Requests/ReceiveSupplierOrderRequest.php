<?php

declare(strict_types=1);

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ReceiveSupplierOrderRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'items'                            => ['required', 'array', 'min:1'],
            'items.*.order_item_id'            => ['required', 'integer', 'exists:supplier_order_items,id'],
            'items.*.quantity_received'        => ['required', 'numeric', 'min:0.001'],
            'items.*.batch_number'             => ['nullable', 'string', 'max:100'],
            'items.*.expiry_date'              => ['nullable', 'date', 'after:today'],
            'items.*.custom_attributes'        => ['nullable', 'array'],
            'items.*.custom_attributes.*'      => ['nullable'],
        ];
    }

    public function messages(): array
    {
        return [
            'items.*.order_item_id.exists'           => 'Order item not found.',
            'items.*.quantity_received.min'          => 'Received quantity must be greater than zero.',
            'items.*.expiry_date.after'              => 'Expiry date must be in the future.',
        ];
    }
}
