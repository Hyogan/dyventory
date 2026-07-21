<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\Category;
use App\Models\Product;
use App\Models\VatRate;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class ClothingImportSeeder extends Seeder
{
    /**
     * Reads scripts/data/products_final.json (or products_raw.json as fallback)
     * and inserts 81 real clothing products into the database.
     *
     * Prerequisites: VatRateSeeder + CategorySeeder must have run first.
     *
     * Run:
     *   php artisan db:seed --class=ClothingImportSeeder
     */
    public function run(): void
    {
        $json = $this->loadJson();
        if (empty($json)) {
            $this->command->error('No product JSON found. Run scripts/extract.py (and optionally scripts/name_with_ai.py) first.');
            return;
        }

        $vat      = VatRate::where('is_default', true)->firstOrFail();
        $clothing = Category::where('slug', 'clothing')->firstOrFail();

        // ── Sub-categories ───────────────────────────────────────────────────
        $categories = $this->ensureSubcategories($clothing);

        // ── Products ─────────────────────────────────────────────────────────
        $created  = 0;
        $skipped  = 0;

        foreach ($json as $item) {
            $catSlug  = $item['category_slug'] ?? 'clothing-toddler';
            $category = $categories[$catSlug] ?? $clothing;

            $name = $this->resolveName($item);
            $sku  = $item['sku'];

            if (Product::where('sku', $sku)->exists()) {
                $skipped++;
                continue;
            }

            $images = [];
            if (!empty($item['image_path'])) {
                $images[] = $item['image_path'];
            }

            $attributes = [
                'available_sizes' => $item['sizes_text'] ?? null,
                'qty_per_pack'    => $item['qty_per_pack'] ?? null,
                'colour'          => $item['colour_notes'] ?? null,
                'material'        => $item['material'] ?? null,
            ];
            // Remove null entries
            $attributes = array_filter($attributes, fn($v) => $v !== null);

            Product::create([
                'category_id'           => $category->id,
                'vat_rate_id'           => $vat->id,
                'name'                  => $name,
                'sku'                   => $sku,
                'description'           => $this->buildDescription($item),
                'unit_of_measure'       => 'set',
                'price_buy_ht'          => $item['price_buy_ht']   ?? 0,
                'price_sell_ttc'        => $item['price_sell_ttc'] ?? 0,
                'stock_alert_threshold' => 2,
                'has_variants'          => false,
                'attributes'            => $attributes,
                'images'                => $images,
                'status'                => 'active',
            ]);

            $created++;
        }

        $this->command->info("✅  ClothingImportSeeder: {$created} products created, {$skipped} skipped (already exist).");
    }

    // ── private helpers ───────────────────────────────────────────────────────

    private function loadJson(): array
    {
        $base = base_path('../../scripts/data');

        foreach (['products_final.json', 'products_raw.json'] as $file) {
            $path = $base . DIRECTORY_SEPARATOR . $file;
            if (file_exists($path)) {
                $this->command->line("  Loading {$file}");
                return json_decode(file_get_contents($path), true) ?? [];
            }
        }

        return [];
    }

    private function ensureSubcategories(Category $parent): array
    {
        $defs = [
            'clothing-baby' => [
                'name'        => 'Vêtements bébé',
                'description' => 'Vêtements pour nourrissons et bébés (0–24 mois)',
                'sort_order'  => 1,
                'field_schema' => [
                    ['key' => 'available_sizes', 'label' => 'Tailles disponibles', 'label_fr' => 'Tailles disponibles',
                     'type' => 'text', 'required' => false, 'applies_to' => 'product'],
                    ['key' => 'qty_per_pack',    'label' => 'Qty per pack',        'label_fr' => 'Quantité par lot',
                     'type' => 'number', 'required' => false, 'applies_to' => 'product'],
                ],
            ],
            'clothing-toddler' => [
                'name'        => 'Vêtements enfant (2–7 ans)',
                'description' => 'Vêtements pour jeunes enfants et accessoires bébé',
                'sort_order'  => 2,
                'field_schema' => [
                    ['key' => 'available_sizes', 'label' => 'Tailles disponibles', 'label_fr' => 'Tailles disponibles',
                     'type' => 'text', 'required' => false, 'applies_to' => 'product'],
                    ['key' => 'qty_per_pack',    'label' => 'Qty per pack',        'label_fr' => 'Quantité par lot',
                     'type' => 'number', 'required' => false, 'applies_to' => 'product'],
                ],
            ],
            'clothing-children' => [
                'name'        => 'Vêtements grand enfant (7–14 ans)',
                'description' => 'Vêtements pour enfants plus grands (tailles en cm)',
                'sort_order'  => 3,
                'field_schema' => [
                    ['key' => 'available_sizes', 'label' => 'Tailles disponibles', 'label_fr' => 'Tailles disponibles',
                     'type' => 'text', 'required' => false, 'applies_to' => 'product'],
                    ['key' => 'qty_per_pack',    'label' => 'Qty per pack',        'label_fr' => 'Quantité par lot',
                     'type' => 'number', 'required' => false, 'applies_to' => 'product'],
                ],
            ],
        ];

        $result = [];
        foreach ($defs as $slug => $def) {
            $result[$slug] = Category::updateOrCreate(
                ['slug' => $slug],
                array_merge($def, ['parent_id' => $parent->id, 'is_active' => true])
            );
        }

        return $result;
    }

    private function resolveName(array $item): string
    {
        // Prefer AI-generated French name; fall back to English; then auto-generate
        if (!empty($item['name_fr'])) {
            return $item['name_fr'];
        }
        if (!empty($item['name_en'])) {
            return $item['name_en'];
        }

        // Auto-generate from available data
        $catLabels = [
            'clothing-baby'     => 'Article bébé',
            'clothing-toddler'  => 'Article enfant',
            'clothing-children' => 'Article grand enfant',
        ];
        $prefix = $catLabels[$item['category_slug'] ?? ''] ?? 'Article';
        $num    = ltrim(explode('-', $item['sku'])[2] ?? '000', '0') ?: '0';

        return "{$prefix} {$num}";
    }

    private function buildDescription(array $item): string
    {
        $parts = [];

        if (!empty($item['name_en'])) {
            $parts[] = $item['name_en'];
        }
        if (!empty($item['sizes_text'])) {
            $parts[] = 'Tailles : ' . $item['sizes_text'];
        }
        if (!empty($item['qty_per_pack'])) {
            $parts[] = 'Lot de ' . $item['qty_per_pack'] . ' pièces';
        }
        if (!empty($item['material'])) {
            $parts[] = 'Matière : ' . $item['material'];
        }

        return implode(' — ', $parts);
    }
}
