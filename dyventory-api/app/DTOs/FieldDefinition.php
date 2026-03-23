<?php

declare(strict_types=1);

namespace App\DTOs;

use App\Enums\FieldType;

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
            key:       $data['key'],
            label:     $data['label'],
            labelFr:   $data['label_fr'] ?? $data['label'],
            type:      FieldType::from($data['type']),
            required:  (bool) ($data['required'] ?? false),
            appliesTo: $data['applies_to'] ?? 'product',
            options:   $data['options'] ?? null,
            min:       isset($data['min']) ? (float) $data['min'] : null,
            max:       isset($data['max']) ? (float) $data['max'] : null,
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

        if ($this->options !== null) {
            $data['options'] = $this->options;
        }

        if ($this->min !== null) {
            $data['min'] = $this->min;
        }

        if ($this->max !== null) {
            $data['max'] = $this->max;
        }

        return $data;
    }
}