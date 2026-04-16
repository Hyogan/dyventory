<?php

declare(strict_types=1);

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateSettingRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // Authorization handled in controller via Policy
    }

    public function rules(): array
    {
        return [
            'settings'   => ['required', 'array', 'min:1'],
            'settings.*' => ['nullable'],
        ];
    }

    public function messages(): array
    {
        return [
            'settings.required' => 'The settings object is required.',
            'settings.array'    => 'Settings must be a key/value object.',
        ];
    }
}
