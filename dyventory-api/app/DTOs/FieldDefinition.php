<?php

declare(strict_types=1);

namespace App\DTOs;

use App\Enums\FieldType;

/**
 * Value object representing a single field definition in a category's field_schema.
 *
 * This DTO is used throughout the backend to pass strongly-typed field
 * definitions rather than raw arrays, and is the canonical shape that
 * FieldSchemaService works with.
 *
 * JSON shape stored in categories.field_schema:
 * {
 *   "key":        "expiry_date",       // immutable once created
 *   "label":      "Expiry date (DLC)", // English
 *   "label_fr":   "Date limite de consommation",
 *   "type":       "date",
 *   "required":   true,
 *   "applies_to": "batch",             // "product" | "batch"
 *   "options":    [],                  // for select / radio only
 *   "min":        null,                // for number only
 *   "max":        null                 // for number only
 * }
 */
final class FieldDefinition
{
    /**
     * @param string[]|null $options For select/radio fields
     */
    public function __construct(
        public readonly string    $key,
        public readonly string    $label,
        public readonly string    $labelFr,
        public readonly FieldType $type,
        public readonly bool      $required,
        public readonly string    $appliesTo, // 'product' | 'batch'
        public readonly ?array    $options = null,
        public readonly ?float    $min = null,
        public readonly ?float    $max = null,
    ) {}

    /**
     * Construct from raw array (e.g. from JSONB).
     *
     * @param array<string, mixed> $data
     */
    public static function fromArray(array $data): self
    {
        return new self(
            key: (string) ($data['key'] ?? ''),
            label: (string) ($data['label'] ?? ''),
            labelFr: (string) ($data['label_fr'] ?? ''),
            type: FieldType::from((string) ($data['type'] ?? 'text')),
            required: (bool) ($data['required'] ?? false),
            appliesTo: (string) ($data['applies_to'] ?? 'product'),
            options: array_values(array_map('strval', (array) ($data['options'] ?? []))),
            min: isset($data['min']) ? (float) $data['min'] : null,
            max: isset($data['max']) ? (float) $data['max'] : null,
        );
    }

    /**
     * Convert back to array for JSONB storage.
     *
     * @return array<string, mixed>
     */
    public function toArray(): array
    {
        $data = [
            'key'        => $this->key,
            'label'      => $this->label,
            'label_fr'   => $this->labelFr,
            'type'       => $this->type->value,
            'required'   => $this->required,
            'applies_to' => $this->appliesTo,
        ];
        if ($this->type->requiresOptions()) {
            $data['options'] = $this->options;
        }

        if ($this->type->supportsRange()) {
            if ($this->min !== null) {
                $data['min'] = $this->min;
            }
            if ($this->max !== null) {
                $data['max'] = $this->max;
            }
        }

        return $data;
    }

    // ─────────────────────────────────────────────
    // Helpers
    // ─────────────────────────────────────────────

    public function appliesToProduct(): bool
    {
        return $this->appliesTo === 'product';
    }

    public function appliesToBatch(): bool
    {
        return $this->appliesTo === 'batch';
    }
}
