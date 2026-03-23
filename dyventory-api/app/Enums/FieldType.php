<?php

declare(strict_types=1);

namespace App\Enums;
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
        return match($this) {
            self::Text     => 'Text input',
            self::Number   => 'Number input',
            self::Date     => 'Date picker',
            self::Select   => 'Dropdown select',
            self::Checkbox => 'Checkbox',
            self::Radio    => 'Radio group',
            self::Textarea => 'Multiline text',
        };
    }

    /** Whether this type can have selectable options */
    public function hasOptions(): bool
    {
        return match($this) {
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