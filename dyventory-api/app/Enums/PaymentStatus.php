<?php

declare(strict_types=1);

namespace App\Enums;

enum PaymentStatus: string
{
    case Pending   = 'pending';
    case Partial   = 'partial';
    case Paid      = 'paid';
    case Overdue   = 'overdue';
    case Refunded  = 'refunded';

    public function label(): string
    {
        return match($this) {
            self::Pending  => 'Pending',
            self::Partial  => 'Partially paid',
            self::Paid     => 'Paid',
            self::Overdue  => 'Overdue',
            self::Refunded => 'Refunded',
        };
    }
}