<?php

declare(strict_types=1);

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreClientRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // Authorization handled in controller via Policy
    }

    public function rules(): array
    {
        return [
            'name'         => ['required', 'string', 'max:255'],
            'email'        => ['nullable', 'email', 'max:255', Rule::unique('clients', 'email')],
            'phone'        => ['nullable', 'string', 'max:30'],
            'address'      => ['nullable', 'string', 'max:1000'],
            'type'         => ['nullable', 'string', Rule::in(['individual', 'company', 'reseller', 'wholesaler', 'retailer'])],
            'credit_limit' => ['nullable', 'numeric', 'min:0'],
            'notes'        => ['nullable', 'string', 'max:2000'],
            'is_active'    => ['nullable', 'boolean'],
        ];
    }
}
