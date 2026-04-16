<?php

declare(strict_types=1);

namespace App\Http\Requests;

use App\Enums\SaleStatus;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreSaleRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // Gate checked in controller
    }

    public function rules(): array
    {
        return [
            'client_id'           => ['nullable', 'integer', 'exists:clients,id'],
            'payment_method'      => ['nullable', 'string', Rule::in(['cash', 'mobile_money', 'bank_transfer', 'credit'])],
            'due_date'            => ['nullable', 'date', 'after:today', Rule::requiredIf($this->input('payment_method') === 'credit')],
            'discount_amount'     => ['nullable', 'numeric', 'min:0'],
            'notes'               => ['nullable', 'string', 'max:1000'],
            'status'              => ['nullable', 'string', Rule::in([SaleStatus::Draft->value, SaleStatus::Confirmed->value])],

            'items'               => ['required', 'array', 'min:1'],
            'items.*.product_id'  => ['required', 'integer', 'exists:products,id'],
            'items.*.variant_id'  => ['nullable', 'integer', 'exists:product_variants,id'],
            'items.*.quantity'    => ['required', 'numeric', 'min:0.001'],
            'items.*.discount_percent' => ['nullable', 'numeric', 'min:0', 'max:100'],
        ];
    }

    public function messages(): array
    {
        return [
            'items.required'              => 'A sale must have at least one item.',
            'items.min'                   => 'A sale must have at least one item.',
            'items.*.product_id.required' => 'Each item must reference a product.',
            'items.*.product_id.exists'   => 'One or more products do not exist.',
            'items.*.quantity.min'        => 'Item quantity must be greater than zero.',
            'due_date.required_if'        => 'A due date is required for credit sales.',
        ];
    }
}
