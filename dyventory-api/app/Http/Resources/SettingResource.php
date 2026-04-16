<?php

declare(strict_types=1);

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class SettingResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'key'        => $this->key,
            'value'      => $this->typedValue(),
            'group'      => $this->group,
            'type'       => $this->type,
            'label'      => $this->label,
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
