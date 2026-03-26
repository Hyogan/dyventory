<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\VatRate;
use Illuminate\Database\Seeder;

class VatRateSeeder extends Seeder
{
    public function run(): void
    {
        $rates = [
            ['name' => 'Standard rate (TVA)',  'rate' => 19.25, 'is_default' => true,  'is_active' => true],
            ['name' => 'Reduced rate',         'rate' => 0.00,  'is_default' => false, 'is_active' => true],
        ];

        foreach ($rates as $rate) {
            VatRate::updateOrCreate(['name' => $rate['name']], $rate);
        }

        $this->command->info('✅  VAT rates seeded — 19.25% default (Cameroon standard)');
    }
}
