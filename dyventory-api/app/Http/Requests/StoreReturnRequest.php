<?php

declare(strict_types=1);

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreReturnRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'reason'             => ['required', 'string', 'max:500'],
            'resolution'         => ['required', 'string', Rule::in(['refund', 'credit_note', 'exchange'])],
            'refund_amount'      => ['nullable', 'numeric', 'min:0'],
            'restock'            => ['nullable', 'boolean'],
            'notes'              => ['nullable', 'string', 'max:1000'],
            'items'              => ['required', 'array', 'min:1'],
            'items.*.product_id' => ['required', 'integer', 'exists:products,id'],
            'items.*.quantity'   => ['required', 'numeric', 'min:0.001'],
            'items.*.batch_id'   => ['nullable', 'integer', 'exists:batches,id'],
        ];
    }
}
