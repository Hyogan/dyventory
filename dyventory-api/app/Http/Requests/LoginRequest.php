<?php

declare(strict_types=1);

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class LoginRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'email'    => ['required', 'string', 'email'],
            'password' => ['required', 'string', 'min:1'],
        ];
    }



    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'email.required'    => __('validation.required', ['attribute' => __('validation.attributes.email')]),
            'email.email'       => __('validation.email', ['attribute' => __('validation.attributes.email')]),
            'password.required' => __('validation.required', ['attribute' => __('validation.attributes.password')]),
            'password.min'      => __('validation.min.string', ['attribute' => __('validation.attributes.password'), 'min' => 8]),
        ];
    }
}
