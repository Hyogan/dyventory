<?php

declare(strict_types=1);

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateSupplierRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name'                 => ['sometimes', 'string', 'max:255'],
            'email'                => ['sometimes', 'nullable', 'email', 'max:255'],
            'phone'                => ['sometimes', 'nullable', 'string', 'max:30'],
            'address'              => ['sometimes', 'nullable', 'string', 'max:1000'],
            'contact_person'       => ['sometimes', 'nullable', 'string', 'max:255'],
            'lead_time_days'       => ['sometimes', 'nullable', 'integer', 'min:0'],
            'minimum_order_amount' => ['sometimes', 'nullable', 'numeric', 'min:0'],
            'notes'                => ['sometimes', 'nullable', 'string', 'max:2000'],
            'is_active'            => ['sometimes', 'boolean'],
        ];
    }
}
