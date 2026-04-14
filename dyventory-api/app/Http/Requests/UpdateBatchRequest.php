<?php

declare(strict_types=1);

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateBatchRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'supplier_id'  => ['nullable', 'integer', 'exists:suppliers,id'],
            'batch_number' => ['nullable', 'string', 'max:100'],
            'received_at'  => ['nullable', 'date'],
            'attributes'   => ['nullable', 'array'],
            'status'       => ['nullable', 'string', 'in:active,depleted,expired'],
        ];
    }
}
