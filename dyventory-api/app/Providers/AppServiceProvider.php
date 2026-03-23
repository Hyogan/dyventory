<?php

namespace App\Providers;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;
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
