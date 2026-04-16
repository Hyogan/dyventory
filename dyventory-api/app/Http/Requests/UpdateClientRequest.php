<?php

declare(strict_types=1);

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateClientRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $clientId = $this->route('client')?->id;

        return [
            'name'         => ['sometimes', 'string', 'max:255'],
            'email'        => ['sometimes', 'nullable', 'email', 'max:255', Rule::unique('clients', 'email')->ignore($clientId)],
            'phone'        => ['sometimes', 'nullable', 'string', 'max:30'],
            'address'      => ['sometimes', 'nullable', 'string', 'max:1000'],
            'type'         => ['sometimes', 'string', Rule::in(['individual', 'company', 'reseller', 'wholesaler', 'retailer'])],
            'credit_limit' => ['sometimes', 'numeric', 'min:0'],
            'notes'        => ['sometimes', 'nullable', 'string', 'max:2000'],
            'is_active'    => ['sometimes', 'boolean'],
        ];
    }
}
