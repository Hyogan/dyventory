<?php

declare(strict_types=1);

namespace App\Enums;

enum MovementType: string
{
    case InPurchase  = 'in_purchase';
    case InReturn    = 'in_return';
    case OutSale     = 'out_sale';
    case OutLoss     = 'out_loss';
    case OutExpiry   = 'out_expiry';
    case OutMortality = 'out_mortality';
    case Adjustment  = 'adjustment';

    public function label(): string
    {
        return match($this) {
            self::InPurchase   => 'Stock entry — Purchase',
            self::InReturn     => 'Stock entry — Customer return',
            self::OutSale      => 'Stock exit — Sale',
            self::OutLoss      => 'Stock exit — Loss / Damage',
            self::OutExpiry    => 'Stock exit — Expiry',
            self::OutMortality => 'Stock exit — Mortality',
            self::Adjustment   => 'Inventory adjustment',
        };
    }

    public function isEntry(): bool
    {
        return match($this) {
            self::InPurchase, self::InReturn => true,
            default                           => false,
        };
    }

    public function isExit(): bool
    {
        return ! $this->isEntry() && $this !== self::Adjustment;
    }
}