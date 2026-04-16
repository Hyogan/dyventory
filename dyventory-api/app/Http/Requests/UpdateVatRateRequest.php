<?php

declare(strict_types=1);

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateVatRateRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $vatRateId = $this->route('vatRate')?->id;

        return [
            'name'       => ['sometimes', 'string', 'max:100', Rule::unique('vat_rates', 'name')->ignore($vatRateId)],
            'rate'       => ['sometimes', 'numeric', 'min:0', 'max:100'],
            'is_default' => ['sometimes', 'boolean'],
            'is_active'  => ['sometimes', 'boolean'],
        ];
    }
}
