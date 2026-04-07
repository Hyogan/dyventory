<?php

declare(strict_types=1);

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UserResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        // return parent::toArray($request);

        return [
            'id'        => $this->id,
            'name'      => $this->name,
            'email'     => $this->email,
            'role'       => $this->role->value,
            'role_label' => $this->role->label(),
            'role_label_fr' => $this->role->labelFr(),
            'phone'     => $this->phone,
            'is_active' => $this->is_active,
        ];
    }
}
