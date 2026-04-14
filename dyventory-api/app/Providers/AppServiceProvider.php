<?php

declare(strict_types=1);

namespace App\Providers;

use App\Models\Batch;
use App\Models\Category;
use App\Models\InventorySession;
use App\Models\Product;
use App\Models\StockMovement;
use App\Policies\BatchPolicy;
use App\Policies\CategoryPolicy;
use App\Policies\InventorySessionPolicy;
use App\Policies\ProductPolicy;
use App\Policies\StockMovementPolicy;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Gate::policy(Category::class, CategoryPolicy::class);
        Gate::policy(Product::class, ProductPolicy::class);
        Gate::policy(Batch::class, BatchPolicy::class);
        Gate::policy(StockMovement::class, StockMovementPolicy::class);
        Gate::policy(InventorySession::class, InventorySessionPolicy::class);

        Model::preventLazyLoading(! app()->isProduction());

        // Auto-eager-load relationships (Laravel 12.8+)
        // Disable if you prefer explicit with() everywhere
        // Model::automaticallyEagerLoadRelationships();

        // Prevent silently discarding attributes not in $fillable
        Model::preventSilentlyDiscardingAttributes(! app()->isProduction());

        // Enforce strict mode — prevent accessing attributes that don't exist
        Model::shouldBeStrict(! app()->isProduction());

        // Log slow queries in development
        if (app()->isLocal()) {
            DB::listen(function (object $query): void {
                if ($query->time > 500) {
                    logger()->warning('Slow query detected', [
                        'sql'      => $query->sql,
                        'bindings' => $query->bindings,
                        'time_ms'  => $query->time,
                    ]);
                }
            });
        }
    }
}


// <?php

// declare(strict_types=1);

// namespace App\Providers;

// use App\Models\Client;
// use App\Models\Product;
// use App\Models\Sale;
// use App\Models\Supplier;
// use App\Models\User;
// use App\Policies\ClientPolicy;
// use App\Policies\ProductPolicy;
// use App\Policies\ReportPolicy;
// use App\Policies\SalePolicy;
// use App\Policies\SupplierPolicy;
// use App\Policies\UserPolicy;
// use Illuminate\Database\Eloquent\Model;
// use Illuminate\Support\Facades\Gate;
// use Illuminate\Support\Facades\Queue;
// use Illuminate\Support\ServiceProvider;

// class AppServiceProvider extends ServiceProvider
// {
//     public function register(): void
//     {
//         //
//     }

//     public function boot(): void
//     {
//         $this->configureModels();
//         $this->registerPolicies();
//         $this->configureQueueRouting();
//     }

//     // ─────────────────────────────────────────────
//     // Model configuration
//     // ─────────────────────────────────────────────

//     private function configureModels(): void
//     {
//         /*
//          * Automatically eager-load relationships that are accessed but not
//          * loaded — prevents N+1 queries globally.
//          * (Inherited from Laravel 12 — still required in 13.)
//          */
//         Model::automaticallyEagerLoadRelationships();

//         /*
//          * Strict mode: throw on lazy loading, mass-assignment violations,
//          * and accessing missing attributes — but only outside production
//          * where these would be silent failures.
//          */
//         Model::shouldBeStrict(! $this->app->isProduction());
//     }

//     // ─────────────────────────────────────────────
//     // RBAC Policies
//     // ─────────────────────────────────────────────

//     private function registerPolicies(): void
//     {
//         // Model-bound policies
//         Gate::policy(Product::class,  ProductPolicy::class);
//         Gate::policy(Sale::class,     SalePolicy::class);
//         Gate::policy(Client::class,   ClientPolicy::class);
//         Gate::policy(Supplier::class, SupplierPolicy::class);
//         Gate::policy(User::class,     UserPolicy::class);

//         // Non-model gates for reports & administration
//         Gate::define('viewDashboard',    [ReportPolicy::class, 'viewDashboard']);
//         Gate::define('viewSalesReports', [ReportPolicy::class, 'viewSalesReports']);
//         Gate::define('viewStockReports', [ReportPolicy::class, 'viewStockReports']);
//         Gate::define('viewTvaReports',   [ReportPolicy::class, 'viewTvaReports']);
//         Gate::define('viewCreditReports',[ReportPolicy::class, 'viewCreditReports']);
//         Gate::define('viewLossReports',  [ReportPolicy::class, 'viewLossReports']);
//         Gate::define('exportReports',    [ReportPolicy::class, 'export']);
//         Gate::define('viewAuditTrail',   [ReportPolicy::class, 'viewAuditTrail']);
//         Gate::define('configureAlerts',  [ReportPolicy::class, 'configureAlerts']);
//     }

//     // ─────────────────────────────────────────────
//     // Centralised Queue routing — Laravel 13 feature
//     // ─────────────────────────────────────────────

//     private function configureQueueRouting(): void
//     {
//         /*
//          * Laravel 13 introduces Queue::route() — all queue/connection
//          * assignments live here instead of being scattered across dispatch
//          * call sites.  Dispatch is now clean: GenerateInvoicePdf::dispatch($sale)
//          * with no ->onQueue() chained.
//          */

//         // Document generation — memory-intensive, isolated queue
//         Queue::route(\App\Jobs\GenerateInvoicePdf::class,      connection: 'redis', queue: 'documents');
//         Queue::route(\App\Jobs\GenerateDeliveryNotePdf::class,  connection: 'redis', queue: 'documents');
//         Queue::route(\App\Jobs\GenerateCreditNotePdf::class,    connection: 'redis', queue: 'documents');

//         // Stock & credit alerts — high-priority, separate queue
//         Queue::route(\App\Jobs\CheckStockAlerts::class,         connection: 'redis', queue: 'alerts');
//         Queue::route(\App\Jobs\CheckOverdueCredits::class,      connection: 'redis', queue: 'alerts');

//         // Report exports — can be slow, isolated from business ops
//         Queue::route(\App\Jobs\ExportReport::class,             connection: 'redis', queue: 'exports');
//     }
// }