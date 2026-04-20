<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\CreditReportService;
use App\Services\ExportService;
use App\Services\SalesReportService;
use App\Services\StockForecastService;
use App\Services\StockReportService;
use App\Services\TvaReportService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Gate;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ReportController extends Controller
{
    public function __construct(
        private readonly SalesReportService   $sales,
        private readonly StockReportService   $stock,
        private readonly TvaReportService     $tva,
        private readonly CreditReportService  $credit,
        private readonly StockForecastService $forecast,
        private readonly ExportService        $exporter,
    ) {}

    // ── Sales ─────────────────────────────────────────────────────────────────

    public function salesSummary(Request $request): JsonResponse
    {
        Gate::authorize('viewSalesReports');
        [$from, $to] = $this->range($request);

        return response()->json($this->sales->summary($from, $to));
    }

    public function salesByPeriod(Request $request): JsonResponse
    {
        Gate::authorize('viewSalesReports');
        [$from, $to] = $this->range($request);
        $granularity  = $request->query('granularity', 'month');

        return response()->json($this->sales->byPeriod($granularity, $from, $to));
    }

    public function salesByVendor(Request $request): JsonResponse
    {
        Gate::authorize('viewSalesReports');
        [$from, $to] = $this->range($request);

        return response()->json($this->sales->byVendor($from, $to));
    }

    public function salesByCategory(Request $request): JsonResponse
    {
        Gate::authorize('viewSalesReports');
        [$from, $to] = $this->range($request);

        return response()->json($this->sales->byCategory($from, $to));
    }

    public function salesByClient(Request $request): JsonResponse
    {
        Gate::authorize('viewSalesReports');
        [$from, $to] = $this->range($request);
        $limit        = min((int) $request->query('limit', 20), 100);

        return response()->json($this->sales->byClient($from, $to, $limit));
    }

    public function salesByPaymentMethod(Request $request): JsonResponse
    {
        Gate::authorize('viewSalesReports');
        [$from, $to] = $this->range($request);

        return response()->json($this->sales->byPaymentMethod($from, $to));
    }

    // ── Stock ─────────────────────────────────────────────────────────────────

    public function stockValueByCategory(): JsonResponse
    {
        Gate::authorize('viewStockReports');

        return response()->json($this->stock->valueByCategory());
    }

    public function stockLosses(Request $request): JsonResponse
    {
        Gate::authorize('viewStockReports');
        [$from, $to] = $this->range($request);
        $granularity  = $request->query('granularity', 'month');

        return response()->json($this->stock->lossesByPeriod($granularity, $from, $to));
    }

    public function dormantProducts(Request $request): JsonResponse
    {
        Gate::authorize('viewStockReports');
        $days  = min((int) $request->query('days', 90), 365);
        $limit = min((int) $request->query('limit', 50), 200);

        return response()->json($this->stock->dormantProducts($days, $limit));
    }

    public function stockRotation(Request $request): JsonResponse
    {
        Gate::authorize('viewStockReports');
        [$from, $to] = $this->range($request);

        return response()->json($this->stock->rotationRate($from, $to));
    }

    // ── TVA ───────────────────────────────────────────────────────────────────

    public function tvaSummary(Request $request): JsonResponse
    {
        Gate::authorize('viewTvaReports');
        [$from, $to] = $this->range($request);

        return response()->json($this->tva->summary($from, $to));
    }

    public function tvaByPeriod(Request $request): JsonResponse
    {
        Gate::authorize('viewTvaReports');
        [$from, $to] = $this->range($request);
        $granularity  = $request->query('granularity', 'month');

        return response()->json($this->tva->byPeriod($granularity, $from, $to));
    }

    public function tvaByRate(Request $request): JsonResponse
    {
        Gate::authorize('viewTvaReports');
        [$from, $to] = $this->range($request);

        return response()->json($this->tva->byRate($from, $to));
    }

    // ── Credit ────────────────────────────────────────────────────────────────

    public function creditSummary(Request $request): JsonResponse
    {
        Gate::authorize('viewCreditReports');
        [$from, $to] = $this->range($request);

        return response()->json($this->credit->summary($from, $to));
    }

    public function outstandingByClient(Request $request): JsonResponse
    {
        Gate::authorize('viewCreditReports');
        [$from, $to] = $this->range($request);
        $limit        = min((int) $request->query('limit', 30), 100);

        return response()->json($this->credit->outstandingByClient($from, $to, $limit));
    }

    public function overdueInvoices(Request $request): JsonResponse
    {
        Gate::authorize('viewCreditReports');
        $limit = min((int) $request->query('limit', 50), 200);

        return response()->json($this->credit->overdueInvoices($limit));
    }

    public function collectedByPeriod(Request $request): JsonResponse
    {
        Gate::authorize('viewCreditReports');
        [$from, $to] = $this->range($request);
        $granularity  = $request->query('granularity', 'month');

        return response()->json($this->credit->collectedByPeriod($granularity, $from, $to));
    }

    // ── Forecast ──────────────────────────────────────────────────────────────

    public function stockForecast(Request $request): JsonResponse
    {
        Gate::authorize('viewStockReports');
        $limit = min((int) $request->query('limit', 100), 500);

        return response()->json($this->forecast->forecast($limit));
    }

    // ── Exports ───────────────────────────────────────────────────────────────

    /** Export sales summary report as CSV or XLSX. */
    public function exportSales(Request $request): StreamedResponse|\Illuminate\Http\Response
    {
        Gate::authorize('exportReports');
        [$from, $to] = $this->range($request);
        $format      = $request->query('format', 'csv');

        $rows    = $this->sales->byPeriod($request->query('granularity', 'month'), $from, $to);
        $headers = ['Period', 'Sales', 'Revenue TTC', 'Revenue HT', 'TVA', 'Discount'];
        $data    = array_map(fn (array $r): array => [
            $r['period'], $r['sale_count'], $r['revenue_ttc'], $r['revenue_ht'], $r['total_tva'], $r['total_discount'],
        ], $rows);

        $filename = "sales-report-{$from}-{$to}";

        return match ($format) {
            'xlsx'  => $this->exporter->xlsx($filename, $headers, $data),
            'pdf'   => $this->exporter->pdf($filename, 'reports.sales', [
                            'rows' => $rows, 'from' => $from, 'to' => $to,
                        ]),
            default => $this->exporter->csv($filename, $headers, $data),
        };
    }

    /** Export stock forecast report as CSV or XLSX. */
    public function exportStockForecast(Request $request): StreamedResponse|\Illuminate\Http\Response
    {
        Gate::authorize('exportReports');
        $limit   = min((int) $request->query('limit', 100), 500);
        $format  = $request->query('format', 'csv');

        $rows    = $this->forecast->forecast($limit);
        $headers = ['ID', 'Name', 'SKU', 'Unit', 'Current Stock', 'Avg Daily Consumption', 'Days to Stockout', 'Urgency'];
        $data    = array_map(fn (array $r): array => [
            $r['id'], $r['name'], $r['sku'], $r['unit'],
            $r['current_stock'], $r['avg_daily_consumption'], $r['days_to_stockout'] ?? '∞', $r['urgency'],
        ], $rows);

        $filename = 'stock-forecast-' . now()->toDateString();

        return match ($format) {
            'xlsx'  => $this->exporter->xlsx($filename, $headers, $data),
            default => $this->exporter->csv($filename, $headers, $data),
        };
    }

    /** Export TVA report as CSV or XLSX. */
    public function exportTva(Request $request): StreamedResponse|\Illuminate\Http\Response
    {
        Gate::authorize('exportReports');
        [$from, $to] = $this->range($request);
        $format       = $request->query('format', 'csv');

        $rows    = $this->tva->byPeriod($request->query('granularity', 'month'), $from, $to);
        $headers = ['Period', 'Sales', 'HT', 'TVA', 'TTC'];
        $data    = array_map(fn (array $r): array => [
            $r['period'], $r['sale_count'], $r['total_ht'], $r['total_tva'], $r['total_ttc'],
        ], $rows);

        $filename = "tva-report-{$from}-{$to}";

        return match ($format) {
            'xlsx'  => $this->exporter->xlsx($filename, $headers, $data),
            'pdf'   => $this->exporter->pdf($filename, 'reports.tva', [
                            'rows' => $rows, 'from' => $from, 'to' => $to,
                        ]),
            default => $this->exporter->csv($filename, $headers, $data),
        };
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    /** Extract from/to date strings from request, defaulting to current month. */
    private function range(Request $request): array
    {
        $from = $request->query('from', now()->startOfMonth()->toDateString());
        $to   = $request->query('to',   now()->endOfMonth()->toDateString());

        return [(string) $from, (string) $to];
    }
}
