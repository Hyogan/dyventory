<?php

declare(strict_types=1);

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class SalePaymentResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'             => $this->id,
            'sale_id'        => $this->sale_id,
            'user_id'        => $this->user_id,
            'amount'         => (float) $this->amount,
            'payment_method' => $this->payment_method,
            'reference'      => $this->reference,
            'notes'          => $this->notes,
            'paid_at'        => $this->paid_at?->toIso8601String(),
            'created_at'     => $this->created_at?->toIso8601String(),
        ];
    }
}
