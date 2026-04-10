<?php

declare(strict_types=1);

namespace App\Services;

use App\DTOs\FieldDefinition;
use App\Enums\FieldType;
use Illuminate\Validation\ValidationException;

/**
 * Three-method service for the dynamic category field schema system.
 *
 * 1. validateSchema()        — validates the *structure* of a field schema definition
 * 2. validateAttributes()    — validates product/batch *values* against a given schema
 * 3. buildValidationRules()  — returns a Laravel rules array for use in Form Requests
 */
class FieldSchemaService
{
    // ─────────────────────────────────────────────
    // 1. Schema structure validation
    // ─────────────────────────────────────────────

    /**
     * Validate the field schema definition itself.
     *
     * Rules enforced:
     * - Every field must have a non-empty `key`, `label`, `label_fr`, and valid `type`
     * - No duplicate keys within the schema
     * - select/radio fields must have at least one option
     * - number fields may optionally have numeric min/max (min must be ≤ max if both present)
     * - `applies_to` must be 'product' or 'batch'
     *
     * @param  array<int, array<string, mixed>>  $schema
     *
     * @throws \Illuminate\Validation\ValidationException
     */
    public function validateSchema(array $schema): void
    {
        $errors = [];
        $seenKeys = [];

        foreach ($schema as $index => $field) {
            $prefix = "schema.{$index}";

            // Required string fields
            foreach (['key', 'label', 'label_fr'] as $required) {
                if (empty($field[$required]) || ! is_string($field[$required])) {
                    $errors["{$prefix}.{$required}"][] = "Field #{$index}: '{$required}' is required and must be a non-empty string.";
                }
            }

            // key format: snake_case, alphanumeric + underscores only
            if (isset($field['key']) && is_string($field['key']) && ! empty($field['key'])) {
                if (! preg_match('/^[a-z][a-z0-9_]*$/', $field['key'])) {
                    $errors["{$prefix}.key"][] = "Field #{$index}: key '{$field['key']}' must start with a lowercase letter and contain only lowercase letters, digits, and underscores.";
                }

                // Duplicate key check
                if (in_array($field['key'], $seenKeys, true)) {
                    $errors["{$prefix}.key"][] = "Field #{$index}: duplicate key '{$field['key']}'. Field keys must be unique within a schema.";
                } else {
                    $seenKeys[] = $field['key'];
                }
            }

            // type must be a valid FieldType value
            $validTypes = FieldType::values();
            if (empty($field['type']) || ! in_array($field['type'], $validTypes, true)) {
                $errors["{$prefix}.type"][] = "Field #{$index}: 'type' must be one of: " . implode(', ', $validTypes) . '.';
                continue; // skip type-specific checks if type is invalid
            }

            $type = FieldType::from($field['type']);

            // applies_to must be 'product' or 'batch'
            if (! isset($field['applies_to']) || ! in_array($field['applies_to'], ['product', 'batch'], true)) {
                $errors["{$prefix}.applies_to"][] = "Field #{$index}: 'applies_to' must be either 'product' or 'batch'.";
            }

            // required must be boolean
            if (isset($field['required']) && ! is_bool($field['required'])) {
                $errors["{$prefix}.required"][] = "Field #{$index}: 'required' must be a boolean.";
            }

            // select/radio require at least one option
            if ($type->requiresOptions()) {
                $options = $field['options'] ?? [];
                if (! is_array($options) || count($options) === 0) {
                    $errors["{$prefix}.options"][] = "Field #{$index} ({$type->value}): 'options' must be a non-empty array.";
                } else {
                    foreach ($options as $optIndex => $opt) {
                        if (! is_string($opt) || trim($opt) === '') {
                            $errors["{$prefix}.options.{$optIndex}"][] = "Field #{$index}: option #{$optIndex} must be a non-empty string.";
                        }
                    }
                }
            }

            // number: validate min/max if present
            if ($type->supportsRange()) {
                if (isset($field['min']) && ! is_numeric($field['min'])) {
                    $errors["{$prefix}.min"][] = "Field #{$index}: 'min' must be numeric.";
                }
                if (isset($field['max']) && ! is_numeric($field['max'])) {
                    $errors["{$prefix}.max"][] = "Field #{$index}: 'max' must be numeric.";
                }
                if (isset($field['min'], $field['max'])
                    && is_numeric($field['min'])
                    && is_numeric($field['max'])
                    && (float) $field['min'] > (float) $field['max']
                ) {
                    $errors["{$prefix}.min"][] = "Field #{$index}: 'min' must be less than or equal to 'max'.";
                }
            }
        }

        if (! empty($errors)) {
            throw ValidationException::withMessages($errors);
        }
    }

    // ─────────────────────────────────────────────
    // 2. Attribute value validation
    // ─────────────────────────────────────────────

    /**
     * Validate a product's or batch's attribute values against the category schema.
     *
     * - Required fields with missing or null values fail.
     * - Optional missing fields pass silently.
     * - select/radio values must be in the allowed options list.
     * - number values respect min/max if defined.
     *
     * @param  array<string, mixed>              $attributes  The values to validate (product.attributes)
     * @param  array<int, array<string, mixed>>  $schema      The category's raw field_schema
     *
     * @throws \Illuminate\Validation\ValidationException
     */
    public function validateAttributes(array $attributes, array $schema): void
    {
        $errors = [];

        foreach ($schema as $field) {
            $definition = FieldDefinition::fromArray($field);
            $key        = $definition->key;
            $value      = $attributes[$key] ?? null;
            $missing    = ! array_key_exists($key, $attributes) || $value === null || $value === '';

            if ($missing) {
                if ($definition->required) {
                    $errors["attributes.{$key}"][] = "'{$definition->label}' is required.";
                }
                continue; // nothing more to check for missing optional fields
            }

            // Type-specific validation
            match ($definition->type) {
                FieldType::Text,
                FieldType::Textarea => $this->validateString($errors, $key, $definition->label, $value),

                FieldType::Number   => $this->validateNumber($errors, $key, $definition->label, $value, $definition->min, $definition->max),

                FieldType::Date     => $this->validateDate($errors, $key, $definition->label, $value),

                FieldType::Select,
                FieldType::Radio    => $this->validateOption($errors, $key, $definition->label, $value, $definition->options ?? []),

                FieldType::Checkbox => $this->validateBool($errors, $key, $definition->label, $value),
            };
        }

        if (! empty($errors)) {
            throw ValidationException::withMessages($errors);
        }
    }

    // ─────────────────────────────────────────────
    // 3. Build Laravel validation rules
    // ─────────────────────────────────────────────

    /**
     * Convert a raw schema array into a Laravel validation rules array
     * for use in Form Requests (e.g. StoreProductRequest).
     *
     * Example output:
     * [
     *   'attributes'              => 'array',
     *   'attributes.expiry_date'  => 'required|date',
     *   'attributes.storage_temp' => 'sometimes|string',
     * ]
     *
     * @param  array<int, array<string, mixed>>  $schema
     * @return array<string, string|list<string>>
     */
    public function buildValidationRules(array $schema): array
    {
        $rules = ['attributes' => 'array'];

        foreach ($schema as $field) {
            $definition = FieldDefinition::fromArray($field);
            $key        = "attributes.{$definition->key}";

            $presence   = $definition->required ? 'required' : 'sometimes|nullable';
            $typeRule   = $definition->type->valueRule();

            $fieldRules = "{$presence}|{$typeRule}";

            // For select/radio: add an in: rule with allowed options
            if ($definition->type->requiresOptions() && ! empty($definition->options)) {
                $escaped    = implode(',', array_map(
                    fn (string $o) => str_replace(',', '\\,', $o),
                    $definition->options,
                ));
                $fieldRules .= "|in:{$escaped}";
            }

            // For number: add min/max rules if defined
            if ($definition->type->supportsRange()) {
                if ($definition->min !== null) {
                    $fieldRules .= "|min:{$definition->min}";
                }
                if ($definition->max !== null) {
                    $fieldRules .= "|max:{$definition->max}";
                }
            }

            $rules[$key] = $fieldRules;
        }

        return $rules;
    }

    // ─────────────────────────────────────────────
    // Private type-check helpers
    // ─────────────────────────────────────────────

    /** @param array<string, list<string>> $errors */
    private function validateString(array &$errors, string $key, string $label, mixed $value): void
    {
        if (! is_string($value)) {
            $errors["attributes.{$key}"][] = "'{$label}' must be a string.";
        }
    }

    /** @param array<string, list<string>> $errors */
    private function validateNumber(
        array &$errors,
        string $key,
        string $label,
        mixed $value,
        ?float $min,
        ?float $max,
    ): void {
        if (! is_numeric($value)) {
            $errors["attributes.{$key}"][] = "'{$label}' must be a number.";
            return;
        }

        $numeric = (float) $value;

        if ($min !== null && $numeric < $min) {
            $errors["attributes.{$key}"][] = "'{$label}' must be at least {$min}.";
        }

        if ($max !== null && $numeric > $max) {
            $errors["attributes.{$key}"][] = "'{$label}' must be at most {$max}.";
        }
    }

    /** @param array<string, list<string>> $errors */
    private function validateDate(array &$errors, string $key, string $label, mixed $value): void
    {
        if (! is_string($value) || strtotime($value) === false) {
            $errors["attributes.{$key}"][] = "'{$label}' must be a valid date.";
        }
    }

    /**
     * @param array<string, list<string>> $errors
     * @param list<string>                $options
     */
    private function validateOption(array &$errors, string $key, string $label, mixed $value, array $options): void
    {
        if (! is_string($value)) {
            $errors["attributes.{$key}"][] = "'{$label}' must be a string.";
            return;
        }

        if (! empty($options) && ! in_array($value, $options, true)) {
            $allowed = implode(', ', $options);
            $errors["attributes.{$key}"][] = "'{$label}' must be one of: {$allowed}.";
        }
    }

    /** @param array<string, list<string>> $errors */
    private function validateBool(array &$errors, string $key, string $label, mixed $value): void
    {
        if (! is_bool($value) && ! in_array($value, [0, 1, '0', '1', 'true', 'false'], true)) {
            $errors["attributes.{$key}"][] = "'{$label}' must be a boolean.";
        }
    }
}
