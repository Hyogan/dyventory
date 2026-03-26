<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\Category;
use App\Models\Product;
use App\Models\VatRate;
use Illuminate\Database\Seeder;

class ProductSeeder extends Seeder
{
    public function run(): void
    {
        $vat     = VatRate::where('is_default', true)->firstOrFail();
        $vatZero = VatRate::where('rate', 0)->first() ?? $vat;

        $perishable = Category::where('slug', 'food-perishable')->firstOrFail();
        $snails     = Category::where('slug', 'snails')->firstOrFail();
        $clothing   = Category::where('slug', 'clothing')->firstOrFail();
        $electronics = Category::where('slug', 'electronics')->firstOrFail();

        $products = [
            // ── Perishable ───────────────────────────────────────────
            [
                'category_id'           => $perishable->id,
                'vat_rate_id'           => $vat->id,
                'name'                  => 'Fresh Tomatoes',
                'sku'                   => 'FOOD-TOM-001',
                'description'           => 'Fresh locally-sourced tomatoes',
                'unit_of_measure'       => 'kg',
                'price_buy_ht'          => 500.00,
                'price_sell_ttc'        => 800.00,
                'stock_alert_threshold' => 5.000,
                'attributes'            => ['storage_condition' => 'Chilled (0–4°C)'],
            ],
            [
                'category_id'           => $perishable->id,
                'vat_rate_id'           => $vat->id,
                'name'                  => 'Pasteurised Milk 1L',
                'sku'                   => 'FOOD-MLK-001',
                'description'           => 'Fresh pasteurised full-fat milk',
                'unit_of_measure'       => 'litre',
                'price_buy_ht'          => 600.00,
                'price_sell_ttc'        => 900.00,
                'stock_alert_threshold' => 10.000,
                'attributes'            => ['storage_condition' => 'Chilled (0–4°C)'],
            ],
            [
                'category_id'           => $perishable->id,
                'vat_rate_id'           => $vat->id,
                'name'                  => 'White Rice 25kg Bag',
                'sku'                   => 'FOOD-RIC-001',
                'description'           => 'Premium Thai white rice, 25 kg bag',
                'unit_of_measure'       => 'piece',
                'price_buy_ht'          => 15000.00,
                'price_sell_ttc'        => 22000.00,
                'stock_alert_threshold' => 3.000,
                'attributes'            => ['storage_condition' => 'Ambient'],
            ],

            // ── Snails ───────────────────────────────────────────────
            [
                'category_id'           => $snails->id,
                'vat_rate_id'           => $vatZero->id,
                'name'                  => 'Giant African Land Snails',
                'sku'                   => 'SNL-GAL-001',
                'description'           => 'Achatina achatina — sold live by kg',
                'unit_of_measure'       => 'kg',
                'price_buy_ht'          => 2500.00,
                'price_sell_ttc'        => 4000.00,
                'stock_alert_threshold' => 2.000,
                'attributes'            => ['origin_farm' => 'Ferme de la Vallée', 'mortality_rate' => 5],
            ],
            [
                'category_id'           => $snails->id,
                'vat_rate_id'           => $vatZero->id,
                'name'                  => 'Petit Gris Snails',
                'sku'                   => 'SNL-PGR-001',
                'description'           => 'Helix aspersa — sold live by kg',
                'unit_of_measure'       => 'kg',
                'price_buy_ht'          => 3000.00,
                'price_sell_ttc'        => 5000.00,
                'stock_alert_threshold' => 1.500,
                'attributes'            => ['origin_farm' => 'Ferme Bamiléké', 'mortality_rate' => 3],
            ],
            [
                'category_id'           => $snails->id,
                'vat_rate_id'           => $vatZero->id,
                'name'                  => 'Snail Eggs (Caviar)',
                'sku'                   => 'SNL-EGG-001',
                'description'           => 'Premium snail caviar — by weight',
                'unit_of_measure'       => 'kg',
                'price_buy_ht'          => 12000.00,
                'price_sell_ttc'        => 20000.00,
                'stock_alert_threshold' => 0.500,
                'attributes'            => ['origin_farm' => 'Ferme de la Vallée'],
            ],

            // ── Clothing ─────────────────────────────────────────────
            [
                'category_id'           => $clothing->id,
                'vat_rate_id'           => $vat->id,
                'name'                  => 'Classic White T-Shirt',
                'sku'                   => 'CLT-TSH-001',
                'description'           => '100% cotton crew-neck t-shirt',
                'unit_of_measure'       => 'piece',
                'price_buy_ht'          => 2000.00,
                'price_sell_ttc'        => 5000.00,
                'stock_alert_threshold' => 5.000,
                'has_variants'          => true,
                'attributes'            => ['brand' => 'BasicWear', 'material' => '100% Cotton'],
            ],
            [
                'category_id'           => $clothing->id,
                'vat_rate_id'           => $vat->id,
                'name'                  => 'Slim Fit Jeans',
                'sku'                   => 'CLT-JNS-001',
                'description'           => 'Classic 5-pocket slim fit denim jeans',
                'unit_of_measure'       => 'piece',
                'price_buy_ht'          => 5000.00,
                'price_sell_ttc'        => 15000.00,
                'stock_alert_threshold' => 3.000,
                'has_variants'          => true,
                'attributes'            => ['brand' => 'DenimCo', 'material' => '98% Cotton 2% Elastane'],
            ],
            [
                'category_id'           => $clothing->id,
                'vat_rate_id'           => $vat->id,
                'name'                  => 'African Print Dress',
                'sku'                   => 'CLT-DRS-001',
                'description'           => 'Traditional Ankara wax print dress',
                'unit_of_measure'       => 'piece',
                'price_buy_ht'          => 8000.00,
                'price_sell_ttc'        => 18000.00,
                'stock_alert_threshold' => 2.000,
                'attributes'            => ['brand' => 'AfriStyle', 'material' => '100% Wax Cotton'],
            ],

            // ── Electronics ──────────────────────────────────────────
            [
                'category_id'           => $electronics->id,
                'vat_rate_id'           => $vat->id,
                'name'                  => 'USB-C Fast Charger 65W',
                'sku'                   => 'ELEC-CHG-001',
                'description'           => 'GaN 65W USB-C PD fast charger',
                'unit_of_measure'       => 'piece',
                'price_buy_ht'          => 5000.00,
                'price_sell_ttc'        => 12000.00,
                'stock_alert_threshold' => 5.000,
                'attributes'            => ['brand' => 'Anker', 'warranty_months' => 12, 'model_reference' => 'A2663'],
            ],
            [
                'category_id'           => $electronics->id,
                'vat_rate_id'           => $vat->id,
                'name'                  => 'Wireless Bluetooth Earbuds',
                'sku'                   => 'ELEC-EAR-001',
                'description'           => 'True wireless stereo earbuds with 24h battery',
                'unit_of_measure'       => 'piece',
                'price_buy_ht'          => 8000.00,
                'price_sell_ttc'        => 20000.00,
                'stock_alert_threshold' => 3.000,
                'attributes'            => ['brand' => 'JBL', 'warranty_months' => 24, 'model_reference' => 'T230NC'],
            ],
            [
                'category_id'           => $electronics->id,
                'vat_rate_id'           => $vat->id,
                'name'                  => 'Power Bank 20000mAh',
                'sku'                   => 'ELEC-PWR-001',
                'description'           => '20000mAh portable power bank, 2× USB-A + 1× USB-C',
                'unit_of_measure'       => 'piece',
                'price_buy_ht'          => 10000.00,
                'price_sell_ttc'        => 25000.00,
                'stock_alert_threshold' => 5.000,
                'attributes'            => ['brand' => 'Romoss', 'warranty_months' => 12, 'model_reference' => 'PEA20'],
            ],
        ];

        foreach ($products as $data) {
            Product::updateOrCreate(['sku' => $data['sku']], $data);
        }

        $this->command->info('✅  Products seeded — 12 sample products across 4 categories');
    }
}
