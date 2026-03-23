<?php

declare(strict_types=1);

namespace App\Enums;

enum SupplierOrderStatus: string
{
    case Draft             = 'draft';
    case Sent              = 'sent';
    case Confirmed         = 'confirmed';
    case PartiallyReceived = 'partially_received';
    case Received          = 'received';
    case Cancelled         = 'cancelled';

    public function label(): string
    {
        return match($this) {
            self::Draft             => 'Draft',
            self::Sent              => 'Sent',
            self::Confirmed         => 'Confirmed',
            self::PartiallyReceived => 'Partially received',
            self::Received          => 'Received',
            self::Cancelled         => 'Cancelled',
        };
    }
}