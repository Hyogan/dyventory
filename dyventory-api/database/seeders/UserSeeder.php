<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Enums\UserRole;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        $users = [
            [
                'name'     => 'Admin User',
                'email'    => 'admin@dyventory.app',
                'password' => Hash::make('password'),
                'role'     => UserRole::Admin,
                'phone'    => '+237600000001',
            ],
            [
                'name'     => 'Manager User',
                'email'    => 'manager@dyventory.app',
                'password' => Hash::make('password'),
                'role'     => UserRole::Manager,
                'phone'    => '+237600000002',
            ],
            [
                'name'     => 'Vendor User',
                'email'    => 'vendor@dyventory.app',
                'password' => Hash::make('password'),
                'role'     => UserRole::Vendor,
                'phone'    => '+237600000003',
            ],
            [
                'name'     => 'Warehouse User',
                'email'    => 'warehouse@dyventory.app',
                'password' => Hash::make('password'),
                'role'     => UserRole::Warehouse,
                'phone'    => '+237600000004',
            ],
            [
                'name'     => 'Accountant User',
                'email'    => 'accountant@dyventory.app',
                'password' => Hash::make('password'),
                'role'     => UserRole::Accountant,
                'phone'    => '+237600000005',
            ],
        ];

        foreach ($users as $data) {
            User::updateOrCreate(['email' => $data['email']], $data);
        }

        $this->command->info('✅  Users seeded — 5 users (one per role)');
    }
}
