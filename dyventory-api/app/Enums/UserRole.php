<?php

declare(strict_types=1);

namespace App\Enums;

enum UserRole: string
{
    case Admin      = 'admin';
    case Manager    = 'manager';
    case Vendor     = 'vendor';
    case Warehouse  = 'warehouse';
    case Accountant = 'accountant';

    public function label(): string
    {
        return match($this) {
            self::Admin      => 'Administrator',
            self::Manager    => 'Manager',
            self::Vendor     => 'Vendor',
            self::Warehouse  => 'Warehouse',
            self::Accountant => 'Accountant',
        };
    }

    public function labelFr(): string
    {
        return match($this) {
            self::Admin      => 'Administrateur',
            self::Manager    => 'Gestionnaire',
            self::Vendor     => 'Vendeur',
            self::Warehouse  => 'Magasinier',
            self::Accountant => 'Comptable',
        };
    }

    /**
     * Returns the permission abilities for this role (used with Sanctum token abilities).
     *
     * @return string[]
     */
    public function permissions(): array
    {
        return match($this) {
            self::Admin => ['*'],
            self::Manager => [
                'products:view', 'products:create', 'products:edit', 'products:archive',
                'categories:manage',
                'stock:view', 'stock:entry', 'stock:exit', 'stock:inventory',
                'sales:view', 'sales:create', 'sales:cancel', 'sales:return',
                'sales:payment', 'sales:promotions', 'sales:invoice',
                'clients:view', 'clients:manage',
                'suppliers:view', 'suppliers:manage',
                'reports:view', 'reports:export',
                'settings:alerts',
            ],
            self::Vendor => [
                'products:view',
                'stock:view',
                'sales:view', 'sales:create', 'sales:payment', 'sales:invoice',
                'clients:view', 'clients:manage',
                'reports:dashboard',
            ],
            self::Warehouse => [
                'products:view',
                'stock:view', 'stock:entry', 'stock:exit', 'stock:inventory',
                'suppliers:view', 'suppliers:manage',
                'reports:dashboard', 'reports:stock',
            ],
            self::Accountant => [
                'sales:view', 'sales:payment', 'sales:invoice',
                'clients:view',
                'reports:dashboard', 'reports:sales', 'reports:vat',
                'reports:credits', 'reports:export',
            ],
        };
    }

    /**
     * @return UserRole[]
     */
    public static function all(): array
    {
        return self::cases();
    }
}