<?php

declare(strict_types=1);

namespace App\Listeners;

use App\Services\DashboardService;

class InvalidateDashboardCache
{
    public function __construct(private readonly DashboardService $dashboard) {}

    /** Handle any event that should bust the dashboard cache. */
    public function handle(object $event): void
    {
        $this->dashboard->invalidate();
    }
}
