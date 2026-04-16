<?php

declare(strict_types=1);

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class SupplierResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'                   => $this->id,
            'name'                 => $this->name,
            'email'                => $this->email,
            'phone'                => $this->phone,
            'address'              => $this->address,
            'contact_person'       => $this->contact_person,
            'lead_time_days'       => $this->lead_time_days,
            'minimum_order_amount' => (float) $this->minimum_order_amount,
            'notes'                => $this->notes,
            'is_active'            => $this->is_active,
            'created_at'           => $this->created_at?->toIso8601String(),
            'updated_at'           => $this->updated_at?->toIso8601String(),
        ];
    }
}
