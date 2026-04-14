<?php

declare(strict_types=1);

namespace App\Http\Requests;

use App\Enums\MovementType;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreStockMovementRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'product_id'     => ['required', 'integer', 'exists:products,id'],
            'variant_id'     => ['nullable', 'integer', 'exists:product_variants,id'],
            'batch_id'       => ['nullable', 'integer', 'exists:batches,id'],
            'type'           => ['required', 'string', Rule::enum(MovementType::class)],
            'quantity'       => ['required', 'numeric', 'min:0.001'],
            'notes'          => ['nullable', 'string', 'max:1000'],
            'reference_id'   => ['nullable', 'integer'],
            'reference_type' => ['nullable', 'string', 'max:255'],
        ];
    }
}
