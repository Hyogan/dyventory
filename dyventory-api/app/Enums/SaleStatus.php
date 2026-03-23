<?php

declare(strict_types=1);

namespace App\Enums;
enum SaleStatus: string
{
    case Draft     = 'draft';
    case Confirmed = 'confirmed';
    case Delivered = 'delivered';
    case Cancelled = 'cancelled';
    case Returned  = 'returned';

    public function label(): string
    {
        return match($this) {
            self::Draft     => 'Draft',
            self::Confirmed => 'Confirmed',
            self::Delivered => 'Delivered',
            self::Cancelled => 'Cancelled',
            self::Returned  => 'Returned',
        };
    }

    /** Whether this status allows cancellation */
    public function canCancel(): bool
    {
        return match($this) {
            self::Draft, self::Confirmed => true,
            default                       => false,
        };
    }
}