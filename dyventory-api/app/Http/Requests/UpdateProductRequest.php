<?php

declare(strict_types=1);

namespace App\Http\Requests;

use App\Models\Category;
use App\Services\FieldSchemaService;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateProductRequest extends FormRequest
{
    public function rules(): array
    {
        $product = $this->route('product');

        $rules = [
            'category_id'          => ['sometimes', 'integer', 'exists:categories,id'],
            'vat_rate_id'          => ['sometimes', 'integer', 'exists:vat_rates,id'],
            'name'                 => ['sometimes', 'string', 'max:255'],
            'sku'                  => ['sometimes', 'string', 'max:100', Rule::unique('products', 'sku')->ignore($product)],
            'description'          => ['sometimes', 'nullable', 'string', 'max:5000'],
            'unit_of_measure'      => ['sometimes', 'string', 'in:piece,kg,g,litre,metre,box'],
            'price_buy_ht'         => ['sometimes', 'numeric', 'min:0'],
            'price_sell_ttc'       => ['sometimes', 'numeric', 'min:0'],
            'barcode'              => ['sometimes', 'nullable', 'string', 'max:50', Rule::unique('products', 'barcode')->ignore($product)],
            'stock_alert_threshold' => ['sometimes', 'numeric', 'min:0'],
            'has_variants'         => ['sometimes', 'boolean'],
            'status'               => ['sometimes', 'string', 'in:active,archived'],
        ];

        // Merge dynamic attribute validation rules from category field schema
        $categoryId = $this->input('category_id', $product?->category_id);

        if ($categoryId && $this->has('attributes')) {
            $category = Category::find($categoryId);

            if ($category && $category->hasFieldSchema()) {
                $productFields = $category->getProductFields()->map->toArray()->all();
                $fieldSchemaService = app(FieldSchemaService::class);
                $dynamicRules = $fieldSchemaService->buildValidationRules($productFields);
                $rules = array_merge($rules, $dynamicRules);
            }
        }

        return $rules;
    }
}
