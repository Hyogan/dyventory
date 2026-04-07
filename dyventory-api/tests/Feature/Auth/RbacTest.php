<?php

declare(strict_types=1);

namespace Tests\Feature\Auth;

use App\Enums\UserRole;
use App\Models\Client;
use App\Models\Product;
use App\Models\Sale;
use App\Models\Supplier;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

/**
 * RBAC Feature Tests — mirrors the permissions matrix in specifications.md §2.1.
 *
 * Strategy: for every policy method, test one role that IS permitted
 * and one role that is NOT permitted.  This gives us full matrix coverage
 * without combinatorial explosion.
 *
 * Uses PHPUnit 12 #[DataProvider] attributes throughout.
 */
class RbacTest extends TestCase
{
    use RefreshDatabase;

    // ─────────────────────────────────────────────
    // Helpers
    // ─────────────────────────────────────────────

    private function actingAsRole(UserRole $role): string
    {
        $user  = User::factory()->create(['role' => $role]);
        $token = $user->createToken('test', $role->permissions())->plainTextToken;
        return $token;
    }

    // ─────────────────────────────────────────────
    // Products
    // ─────────────────────────────────────────────

    /**
     * @return array<string, array{UserRole, int}>
     */
    public static function canViewProductsProvider(): array
    {
        return [
            'admin can view products'     => [UserRole::Admin,      200],
            'manager can view products'   => [UserRole::Manager,    200],
            'vendor can view products'    => [UserRole::Vendor,     200],
            'warehouse can view products' => [UserRole::Warehouse,  200],
            'accountant cannot view products' => [UserRole::Accountant, 403],
        ];
    }

    #[Test]
    #[DataProvider('canViewProductsProvider')]
    public function product_list_access_matches_permissions_matrix(
        UserRole $role,
        int $expectedStatus,
    ): void {
        $token = $this->actingAsRole($role);

        $this->withToken($token)
            ->getJson('/api/v1/products')
            ->assertStatus($expectedStatus);
    }

    /**
     * @return array<string, array{UserRole, int}>
     */
    public static function canCreateProductProvider(): array
    {
        return [
            'admin can create products'       => [UserRole::Admin,      201],
            'manager can create products'     => [UserRole::Manager,    201],
            'vendor cannot create products'   => [UserRole::Vendor,     403],
            'warehouse cannot create products' => [UserRole::Warehouse,  403],
            'accountant cannot create products' => [UserRole::Accountant, 403],
        ];
    }

    #[Test]
    #[DataProvider('canCreateProductProvider')]
    public function product_create_access_matches_permissions_matrix(
        UserRole $role,
        int $expectedStatus,
    ): void {
        $token = $this->actingAsRole($role);

        // Minimal valid payload — category, vat_rate etc. must exist
        // We use a real factory so seeded data is available.
        $category = \App\Models\Category::factory()->create();
        $vatRate  = \App\Models\VatRate::factory()->create();

        $this->withToken($token)
            ->postJson('/api/v1/products', [
                'name'                  => 'Test Product',
                'sku'                   => 'TEST-001',
                'category_id'           => $category->id,
                'unit_of_measure'       => 'piece',
                'price_buy_ht'          => '1000.00',
                'price_sell_ttc'        => '1192.50',
                'vat_rate_id'           => $vatRate->id,
                'stock_alert_threshold' => 5,
                'attributes'            => [],
            ])
            ->assertStatus($expectedStatus);
    }

    /**
     * @return array<string, array{UserRole, int}>
     */
    public static function canArchiveProductProvider(): array
    {
        return [
            'admin can archive products'        => [UserRole::Admin,     204],
            'manager can archive products'      => [UserRole::Manager,   204],
            'vendor cannot archive products'    => [UserRole::Vendor,    403],
            'warehouse cannot archive products' => [UserRole::Warehouse, 403],
            'accountant cannot archive products' => [UserRole::Accountant, 403],
        ];
    }

    #[Test]
    #[DataProvider('canArchiveProductProvider')]
    public function product_delete_access_matches_permissions_matrix(
        UserRole $role,
        int $expectedStatus,
    ): void {
        $product = Product::factory()->create();
        $token   = $this->actingAsRole($role);

        $this->withToken($token)
            ->deleteJson("/api/v1/products/{$product->id}")
            ->assertStatus($expectedStatus);
    }

    // ─────────────────────────────────────────────
    // Stock
    // ─────────────────────────────────────────────

    /**
     * @return array<string, array{UserRole, int}>
     */
    public static function canViewStockProvider(): array
    {
        return [
            'admin can view stock'     => [UserRole::Admin,      200],
            'manager can view stock'   => [UserRole::Manager,    200],
            'vendor can view stock'    => [UserRole::Vendor,     200],
            'warehouse can view stock' => [UserRole::Warehouse,  200],
            'accountant cannot view stock' => [UserRole::Accountant, 403],
        ];
    }

    #[Test]
    #[DataProvider('canViewStockProvider')]
    public function stock_list_access_matches_permissions_matrix(
        UserRole $role,
        int $expectedStatus,
    ): void {
        $token = $this->actingAsRole($role);

        $this->withToken($token)
            ->getJson('/api/v1/stock/movements')
            ->assertStatus($expectedStatus);
    }

    /**
     * @return array<string, array{UserRole, int}>
     */
    public static function canRecordStockEntryProvider(): array
    {
        return [
            'admin can record stock entry'      => [UserRole::Admin,     201],
            'manager can record stock entry'    => [UserRole::Manager,   201],
            'warehouse can record stock entry'  => [UserRole::Warehouse, 201],
            'vendor cannot record stock entry'  => [UserRole::Vendor,    403],
            'accountant cannot record stock entry' => [UserRole::Accountant, 403],
        ];
    }

    #[Test]
    #[DataProvider('canRecordStockEntryProvider')]
    public function stock_entry_access_matches_permissions_matrix(
        UserRole $role,
        int $expectedStatus,
    ): void {
        $product = Product::factory()->create();
        $token   = $this->actingAsRole($role);

        $this->withToken($token)
            ->postJson('/api/v1/stock/entry', [
                'product_id'   => $product->id,
                'quantity'     => '10.000',
                'batch_number' => 'LOT-001',
                'received_at'  => now()->toDateString(),
                'attributes'   => [],
            ])
            ->assertStatus($expectedStatus);
    }

    // ─────────────────────────────────────────────
    // Sales
    // ─────────────────────────────────────────────

    /**
     * @return array<string, array{UserRole, int}>
     */
    public static function canViewSalesProvider(): array
    {
        return [
            'admin can view sales'       => [UserRole::Admin,      200],
            'manager can view sales'     => [UserRole::Manager,    200],
            'vendor can view sales'      => [UserRole::Vendor,     200],
            'accountant can view sales'  => [UserRole::Accountant, 200],
            'warehouse cannot view sales' => [UserRole::Warehouse,  403],
        ];
    }

    #[Test]
    #[DataProvider('canViewSalesProvider')]
    public function sales_list_access_matches_permissions_matrix(
        UserRole $role,
        int $expectedStatus,
    ): void {
        $token = $this->actingAsRole($role);

        $this->withToken($token)
            ->getJson('/api/v1/sales')
            ->assertStatus($expectedStatus);
    }

    /**
     * @return array<string, array{UserRole, int}>
     */
    public static function canCancelSaleProvider(): array
    {
        return [
            'admin can cancel sale'       => [UserRole::Admin,   200],
            'manager can cancel sale'     => [UserRole::Manager, 200],
            'vendor cannot cancel sale'   => [UserRole::Vendor,  403],
            'accountant cannot cancel sale' => [UserRole::Accountant, 403],
            'warehouse cannot cancel sale' => [UserRole::Warehouse, 403],
        ];
    }

    #[Test]
    #[DataProvider('canCancelSaleProvider')]
    public function sale_cancel_access_matches_permissions_matrix(
        UserRole $role,
        int $expectedStatus,
    ): void {
        $sale  = Sale::factory()->create(['status' => 'confirmed']);
        $token = $this->actingAsRole($role);

        $this->withToken($token)
            ->patchJson("/api/v1/sales/{$sale->id}/cancel")
            ->assertStatus($expectedStatus);
    }

    // ─────────────────────────────────────────────
    // Clients
    // ─────────────────────────────────────────────

    /**
     * @return array<string, array{UserRole, int}>
     */
    public static function canViewClientsProvider(): array
    {
        return [
            'admin can view clients'       => [UserRole::Admin,      200],
            'manager can view clients'     => [UserRole::Manager,    200],
            'vendor can view clients'      => [UserRole::Vendor,     200],
            'accountant can view clients'  => [UserRole::Accountant, 200],
            'warehouse cannot view clients' => [UserRole::Warehouse,  403],
        ];
    }

    #[Test]
    #[DataProvider('canViewClientsProvider')]
    public function client_list_access_matches_permissions_matrix(
        UserRole $role,
        int $expectedStatus,
    ): void {
        $token = $this->actingAsRole($role);

        $this->withToken($token)
            ->getJson('/api/v1/clients')
            ->assertStatus($expectedStatus);
    }

    // ─────────────────────────────────────────────
    // Suppliers
    // ─────────────────────────────────────────────

    /**
     * @return array<string, array{UserRole, int}>
     */
    public static function canViewSuppliersProvider(): array
    {
        return [
            'admin can view suppliers'       => [UserRole::Admin,      200],
            'manager can view suppliers'     => [UserRole::Manager,    200],
            'warehouse can view suppliers'   => [UserRole::Warehouse,  200],
            'vendor cannot view suppliers'   => [UserRole::Vendor,     403],
            'accountant cannot view suppliers' => [UserRole::Accountant, 403],
        ];
    }

    #[Test]
    #[DataProvider('canViewSuppliersProvider')]
    public function supplier_list_access_matches_permissions_matrix(
        UserRole $role,
        int $expectedStatus,
    ): void {
        $token = $this->actingAsRole($role);

        $this->withToken($token)
            ->getJson('/api/v1/suppliers')
            ->assertStatus($expectedStatus);
    }

    // ─────────────────────────────────────────────
    // Administration
    // ─────────────────────────────────────────────

    /**
     * @return array<string, array{UserRole, int}>
     */
    public static function canViewUsersProvider(): array
    {
        return [
            'admin can view users'          => [UserRole::Admin,      200],
            'manager cannot view users'     => [UserRole::Manager,    403],
            'vendor cannot view users'      => [UserRole::Vendor,     403],
            'warehouse cannot view users'   => [UserRole::Warehouse,  403],
            'accountant cannot view users'  => [UserRole::Accountant, 403],
        ];
    }

    #[Test]
    #[DataProvider('canViewUsersProvider')]
    public function user_management_access_matches_permissions_matrix(
        UserRole $role,
        int $expectedStatus,
    ): void {
        $token = $this->actingAsRole($role);

        $this->withToken($token)
            ->getJson('/api/v1/users')
            ->assertStatus($expectedStatus);
    }

    /**
     * @return array<string, array{UserRole, int}>
     */
    public static function canViewAuditTrailProvider(): array
    {
        return [
            'admin can view audit trail'         => [UserRole::Admin,      200],
            'manager cannot view audit trail'    => [UserRole::Manager,    403],
            'vendor cannot view audit trail'     => [UserRole::Vendor,     403],
            'warehouse cannot view audit trail'  => [UserRole::Warehouse,  403],
            'accountant cannot view audit trail' => [UserRole::Accountant, 403],
        ];
    }

    #[Test]
    #[DataProvider('canViewAuditTrailProvider')]
    public function audit_trail_access_matches_permissions_matrix(
        UserRole $role,
        int $expectedStatus,
    ): void {
        $token = $this->actingAsRole($role);

        $this->withToken($token)
            ->getJson('/api/v1/audit-logs')
            ->assertStatus($expectedStatus);
    }

    // ─────────────────────────────────────────────
    // Reports
    // ─────────────────────────────────────────────

    /**
     * @return array<string, array{UserRole, int}>
     */
    public static function canViewSalesReportsProvider(): array
    {
        return [
            'admin can view sales reports'       => [UserRole::Admin,      200],
            'manager can view sales reports'     => [UserRole::Manager,    200],
            'accountant can view sales reports'  => [UserRole::Accountant, 200],
            'vendor cannot view sales reports'   => [UserRole::Vendor,     403],
            'warehouse cannot view sales reports' => [UserRole::Warehouse,  403],
        ];
    }

    #[Test]
    #[DataProvider('canViewSalesReportsProvider')]
    public function sales_reports_access_matches_permissions_matrix(
        UserRole $role,
        int $expectedStatus,
    ): void {
        $token = $this->actingAsRole($role);

        $this->withToken($token)
            ->getJson('/api/v1/reports/sales')
            ->assertStatus($expectedStatus);
    }

    /**
     * @return array<string, array{UserRole, int}>
     */
    public static function canViewStockReportsProvider(): array
    {
        return [
            'admin can view stock reports'        => [UserRole::Admin,      200],
            'manager can view stock reports'      => [UserRole::Manager,    200],
            'warehouse can view stock reports'    => [UserRole::Warehouse,  200],
            'vendor cannot view stock reports'    => [UserRole::Vendor,     403],
            'accountant cannot view stock reports' => [UserRole::Accountant, 403],
        ];
    }

    #[Test]
    #[DataProvider('canViewStockReportsProvider')]
    public function stock_reports_access_matches_permissions_matrix(
        UserRole $role,
        int $expectedStatus,
    ): void {
        $token = $this->actingAsRole($role);

        $this->withToken($token)
            ->getJson('/api/v1/reports/stock')
            ->assertStatus($expectedStatus);
    }

    // ─────────────────────────────────────────────
    // Unauthenticated guard
    // ─────────────────────────────────────────────

    /**
     * @return array<string, array{string, string}>
     */
    public static function protectedEndpointsProvider(): array
    {
        return [
            'products index requires auth'  => ['GET',  '/api/v1/products'],
            'sales index requires auth'     => ['GET',  '/api/v1/sales'],
            'clients index requires auth'   => ['GET',  '/api/v1/clients'],
            'suppliers index requires auth' => ['GET',  '/api/v1/suppliers'],
            'stock movements requires auth' => ['GET',  '/api/v1/stock/movements'],
            'users index requires auth'     => ['GET',  '/api/v1/users'],
            'reports sales requires auth'   => ['GET',  '/api/v1/reports/sales'],
            'auth logout requires auth'     => ['POST', '/api/v1/auth/logout'],
            'auth me requires auth'         => ['GET',  '/api/v1/auth/me'],
        ];
    }

    #[Test]
    #[DataProvider('protectedEndpointsProvider')]
    public function protected_endpoint_returns_401_without_token(
        string $method,
        string $uri,
    ): void {
        $this->json($method, $uri)
            ->assertUnauthorized();
    }
}
