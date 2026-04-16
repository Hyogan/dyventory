<?php

declare(strict_types=1);

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class SaleResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'              => $this->id,
            'sale_number'     => $this->sale_number,
            'status'          => $this->status->value,
            'status_label'    => $this->status->label(),
            'payment_status'  => $this->payment_status->value,
            'payment_status_label' => $this->payment_status->label(),
            'payment_method'  => $this->payment_method,

            'client_id'       => $this->client_id,
            'client'          => $this->whenLoaded('client', fn () => [
                'id'    => $this->client->id,
                'name'  => $this->client->name,
                'email' => $this->client->email,
                'phone' => $this->client->phone,
            ]),

            'user_id'         => $this->user_id,
            'user'            => $this->whenLoaded('user', fn () => [
                'id'   => $this->user->id,
                'name' => $this->user->name,
            ]),

            'subtotal_ht'     => (float) $this->subtotal_ht,
            'total_vat'       => (float) $this->total_vat,
            'total_ttc'       => (float) $this->total_ttc,
            'discount_amount' => (float) $this->discount_amount,
            'amount_paid'     => (float) $this->amount_paid,
            'amount_due'      => (float) $this->amount_due,

            'due_date'        => $this->due_date?->toIso8601String(),
            'notes'           => $this->notes,
            'invoice_path'    => $this->invoice_path,

            'items'           => SaleItemResource::collection($this->whenLoaded('items')),
            'payments'        => SalePaymentResource::collection($this->whenLoaded('payments')),
            'returns'         => $this->whenLoaded('returns', fn () => $this->returns->map(fn ($r) => [
                'id'            => $r->id,
                'reason'        => $r->reason,
                'resolution'    => $r->resolution,
                'refund_amount' => (float) $r->refund_amount,
                'restock'       => $r->restock,
                'items'         => $r->items,
                'notes'         => $r->notes,
                'created_at'    => $r->created_at?->toIso8601String(),
            ])),

            'created_at'      => $this->created_at?->toIso8601String(),
            'updated_at'      => $this->updated_at?->toIso8601String(),
        ];
    }
}
