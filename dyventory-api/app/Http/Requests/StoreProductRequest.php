<?php

declare(strict_types=1);

namespace App\Http\Requests;

use App\Models\Category;
use App\Services\FieldSchemaService;
use Illuminate\Foundation\Http\FormRequest;

class StoreProductRequest extends FormRequest
{
    public function rules(): array
    {
        $rules = [
            'category_id'          => ['required', 'integer', 'exists:categories,id'],
            'vat_rate_id'          => ['required', 'integer', 'exists:vat_rates,id'],
            'name'                 => ['required', 'string', 'max:255'],
            'sku'                  => ['sometimes', 'nullable', 'string', 'max:100', 'unique:products,sku'],
            'description'          => ['sometimes', 'nullable', 'string', 'max:5000'],
            'unit_of_measure'      => ['sometimes', 'string', 'in:piece,kg,g,litre,metre,box'],
            'price_buy_ht'         => ['required', 'numeric', 'min:0'],
            'price_sell_ttc'       => ['required', 'numeric', 'min:0'],
            'barcode'              => ['sometimes', 'nullable', 'string', 'max:50', 'unique:products,barcode'],
            'stock_alert_threshold' => ['sometimes', 'numeric', 'min:0'],
            'has_variants'         => ['sometimes', 'boolean'],
            'status'               => ['sometimes', 'string', 'in:active,archived'],
        ];

        // Merge dynamic attribute validation rules from category field schema
        $categoryId = $this->input('category_id');

        if ($categoryId) {
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
