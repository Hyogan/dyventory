<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;

/**
 * Application-wide key/value settings.
 *
 * Each row represents one configurable setting:
 *   key   — machine-readable identifier (e.g. 'company_name')
 *   value — always stored as string; use typedValue() to get a typed PHP value
 *   group — UI grouping (company, alerts, invoices, tax)
 *   type  — string | integer | float | boolean | json
 *   label — human-readable label for the admin UI
 */
#[Fillable(['key', 'value', 'group', 'type', 'label'])]
class Setting extends Model
{
    protected function casts(): array
    {
        return [
            'value' => 'string',
        ];
    }

    /**
     * Return the value cast to the correct PHP type based on $this->type.
     */
    public function typedValue(): mixed
    {
        return match ($this->type) {
            'boolean' => filter_var($this->value, FILTER_VALIDATE_BOOLEAN),
            'integer' => (int) $this->value,
            'float'   => (float) $this->value,
            'json'    => json_decode((string) $this->value, true),
            default   => $this->value,
        };
    }
}
