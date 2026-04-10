<?php

declare(strict_types=1);

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call([
            UserSeeder::class,
            VatRateSeeder::class,
            CategorySeeder::class,
            ProductSeeder::class,
        ]);

        $this->command->info('');
        $this->command->info('🎉  Database seeded successfully!');
        $this->command->info('');
        $this->command->table(
            ['Role', 'Email', 'Password'],
            [
                ['Admin',      'admin@dyventory.app',      'password'],
                ['Manager',    'manager@dyventory.app',    'password'],
                ['Vendor',     'vendor@dyventory.app',     'password'],
                ['Warehouse',  'warehouse@dyventory.app',  'password'],
                ['Accountant', 'accountant@dyventory.app', 'password'],
            ]
        );
    }
}
