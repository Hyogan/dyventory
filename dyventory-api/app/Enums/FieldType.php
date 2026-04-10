<?php

declare(strict_types=1);

namespace App\Enums;


/**
 * Supported field types for the dynamic category field schema.
 * Each value maps to a specific HTML input type on the frontend.
 */
enum FieldType: string
{
    case Text     = 'text';
    case Number   = 'number';
    case Date     = 'date';
    case Select   = 'select';
    case Checkbox = 'checkbox';
    case Radio    = 'radio';
    case Textarea = 'textarea';

    public function label(): string
    {
        return match ($this) {
            self::Text     => 'Text input',
            self::Number   => 'Number input',
            self::Date     => 'Date picker',
            self::Select   => 'Dropdown select',
            self::Checkbox => 'Checkbox',
            self::Radio    => 'Radio group',
            self::Textarea => 'Multiline text',
        };
    }

    /**
     * Human-readable French label.
     */
    public function labelFr(): string
    {
        return match ($this) {
            self::Text     => 'Texte',
            self::Number   => 'Nombre',
            self::Date     => 'Date',
            self::Select   => 'Liste déroulante',
            self::Checkbox => 'Case à cocher',
            self::Radio    => 'Boutons radio',
            self::Textarea => 'Texte multiligne',
        };
    }

    /**
     * Whether this field type requires an `options` array in the definition.
     */
    public function requiresOptions(): bool
    {
        return match ($this) {
            self::Select, self::Radio => true,
            default                   => false,
        };
    }

    /**
     * Whether this field type supports min/max numeric constraints.
     */
    public function supportsRange(): bool
    {
        return $this === self::Number;
    }

    /**
     * Return the Laravel validation rule to apply when validating
     * an attribute VALUE of this type.
     */
    public function valueRule(): string
    {
        return match ($this) {
            self::Text     => 'string|max:1000',
            self::Number   => 'numeric',
            self::Date     => 'date',
            self::Select   => 'string',
            self::Checkbox => 'boolean',
            self::Radio    => 'string',
            self::Textarea => 'string|max:5000',
        };
    }

    /**
     * Return all valid field type values as a string list for validation rules.
     *
     * @return list<string>
     */
    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }

    /** Whether this type can have selectable options */
    public function hasOptions(): bool
    {
        return match ($this) {
            self::Select, self::Radio => true,
            default                   => false,
        };
    }

    /** Whether this type supports min/max validation */
    public function hasRange(): bool
    {
        return $this === self::Number;
    }
}
