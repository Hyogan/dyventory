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
                ['Admin',      'admin@stoky.app',      'password'],
                ['Manager',    'manager@stoky.app',    'password'],
                ['Vendor',     'vendor@stoky.app',     'password'],
                ['Warehouse',  'warehouse@stoky.app',  'password'],
                ['Accountant', 'accountant@stoky.app', 'password'],
            ]
        );
    }
}
