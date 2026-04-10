<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\Category;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class CategorySeeder extends Seeder
{
    public function run(): void
    {
        // ── Food (parent) ────────────────────────────────────────────────
        $food = CategoryResource::updateOrCreate(
            ['slug' => 'food'],
            [
                'name'         => 'Food',
                'slug'         => 'food',
                'description'  => 'Food and beverage products',
                'field_schema' => [],
                'is_active'    => true,
                'sort_order'   => 1,
            ]
        );

        // ── Food — Perishable ─────────────────────────────────────────────
        CategoryResource::updateOrCreate(
            ['slug' => 'food-perishable'],
            [
                'parent_id'   => $food->id,
                'name'        => 'Food — Perishable',
                'slug'        => 'food-perishable',
                'description' => 'Perishable food products with expiry dates and lot tracking',
                'field_schema' => [
                    [
                        'key'        => 'lot_number',
                        'label'      => 'Lot number',
                        'label_fr'   => 'Numéro de lot',
                        'type'       => 'text',
                        'required'   => false,
                        'applies_to' => 'batch',
                    ],
                    [
                        'key'        => 'expiry_date',
                        'label'      => 'Expiry date (DLC)',
                        'label_fr'   => 'Date limite de consommation',
                        'type'       => 'date',
                        'required'   => true,
                        'applies_to' => 'batch',
                    ],
                    [
                        'key'        => 'storage_condition',
                        'label'      => 'Storage condition',
                        'label_fr'   => 'Conditions de stockage',
                        'type'       => 'select',
                        'options'    => ['Frozen (-18°C)', 'Chilled (0–4°C)', 'Ambient'],
                        'required'   => true,
                        'applies_to' => 'product',
                    ],
                ],
                'is_active'  => true,
                'sort_order' => 1,
            ]
        );

        // ── Snails (Living) ────────────────────────────────────────────────
        CategoryResource::updateOrCreate(
            ['slug' => 'snails'],
            [
                'parent_id'    => $food->id,
                'name'         => 'Snails (Living)',
                'slug'         => 'snails',
                'description'  => 'Live snails — sold and stocked in kg',
                'field_schema' => [
                    [
                        'key'        => 'origin_farm',
                        'label'      => 'Origin farm',
                        'label_fr'   => 'Ferme d\'origine',
                        'type'       => 'text',
                        'required'   => false,
                        'applies_to' => 'product',
                    ],
                    [
                        'key'        => 'mortality_rate',
                        'label'      => 'Estimated mortality rate (%)',
                        'label_fr'   => 'Taux de mortalité estimé (%)',
                        'type'       => 'number',
                        'min'        => 0,
                        'max'        => 100,
                        'required'   => false,
                        'applies_to' => 'product',
                    ],
                    [
                        'key'        => 'estimated_lifespan_days',
                        'label'      => 'Estimated lifespan (days)',
                        'label_fr'   => 'Durée de vie estimée (jours)',
                        'type'       => 'number',
                        'min'        => 1,
                        'required'   => false,
                        'applies_to' => 'batch',
                    ],
                ],
                'is_active'  => true,
                'sort_order' => 2,
            ]
        );

        // ── Clothing ───────────────────────────────────────────────────────
        $clothing = CategoryResource::updateOrCreate(
            ['slug' => 'clothing'],
            [
                'name'         => 'Clothing',
                'slug'         => 'clothing',
                'description'  => 'Apparel and fashion products',
                'field_schema' => [
                    [
                        'key'        => 'brand',
                        'label'      => 'Brand',
                        'label_fr'   => 'Marque',
                        'type'       => 'text',
                        'required'   => false,
                        'applies_to' => 'product',
                    ],
                    [
                        'key'        => 'available_sizes',
                        'label'      => 'Available sizes',
                        'label_fr'   => 'Tailles disponibles',
                        'type'       => 'text',
                        'required'   => false,
                        'applies_to' => 'product',
                    ],
                    [
                        'key'        => 'colour',
                        'label'      => 'Colour',
                        'label_fr'   => 'Couleur',
                        'type'       => 'text',
                        'required'   => false,
                        'applies_to' => 'product',
                    ],
                    [
                        'key'        => 'material',
                        'label'      => 'Material / composition',
                        'label_fr'   => 'Matière / composition',
                        'type'       => 'text',
                        'required'   => false,
                        'applies_to' => 'product',
                    ],
                ],
                'is_active'  => true,
                'sort_order' => 2,
            ]
        );

        // ── Electronics ───────────────────────────────────────────────────
        CategoryResource::updateOrCreate(
            ['slug' => 'electronics'],
            [
                'name'         => 'Electronics',
                'slug'         => 'electronics',
                'description'  => 'Electronic devices and accessories',
                'field_schema' => [
                    [
                        'key'        => 'brand',
                        'label'      => 'Brand',
                        'label_fr'   => 'Marque',
                        'type'       => 'text',
                        'required'   => true,
                        'applies_to' => 'product',
                    ],
                    [
                        'key'        => 'model_reference',
                        'label'      => 'Model reference',
                        'label_fr'   => 'Référence modèle',
                        'type'       => 'text',
                        'required'   => false,
                        'applies_to' => 'product',
                    ],
                    [
                        'key'        => 'warranty_months',
                        'label'      => 'Warranty (months)',
                        'label_fr'   => 'Garantie (mois)',
                        'type'       => 'number',
                        'min'        => 0,
                        'required'   => false,
                        'applies_to' => 'product',
                    ],
                    [
                        'key'        => 'serial_number',
                        'label'      => 'Serial number',
                        'label_fr'   => 'Numéro de série',
                        'type'       => 'text',
                        'required'   => false,
                        'applies_to' => 'batch',
                    ],
                ],
                'is_active'  => true,
                'sort_order' => 3,
            ]
        );

        $this->command->info('✅  Categories seeded — Food, Food-Perishable, Snails, Clothing, Electronics');
    }
}
