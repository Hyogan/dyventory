<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Services\BarcodeService;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Response;
use Illuminate\Routing\Controllers\HasMiddleware;
use Illuminate\Routing\Controllers\Middleware;

/**
 * Barcode generation endpoints.
 *
 * GET /api/v1/products/{product}/barcode       → JSON with SVGs
 * GET /api/v1/products/{product}/label-sheet    → PDF download
 */
class BarcodeController extends Controller implements HasMiddleware
{
    public function __construct(
        private readonly BarcodeService $barcodes,
    ) {}

    public static function middleware(): array
    {
        return [
            new Middleware('auth:sanctum'),
        ];
    }

    /**
     * GET /api/v1/products/{product}/barcode
     *
     * Returns Code128 and QR SVGs for a single product.
     */
    public function show(Product $product): JsonResponse
    {
        $this->authorize('view', $product);

        $data = $this->barcodes->forProduct($product);

        return response()->json([
            'data' => $data,
        ]);
    }

    /**
     * GET /api/v1/products/{product}/label-sheet
     *
     * Generates a PDF label sheet (4 columns x 2 rows per A4 page).
     * If the product has variants, each variant gets its own label.
     * Otherwise, 8 labels of the same product are generated.
     */
    public function labelSheet(Product $product): Response
    {
        $this->authorize('view', $product);

        $product->load('variants');

        // Build label data: one per variant, or repeat the product
        if ($product->has_variants && $product->variants->isNotEmpty()) {
            $labels = [];
            foreach ($product->variants as $variant) {
                $value = $variant->barcode_variant ?? $variant->sku_variant;
                $labels[] = [
                    'name'          => $product->name . ' — ' . $variant->sku_variant,
                    'sku'           => $variant->sku_variant,
                    'barcode_value' => $value,
                    'code128'       => $this->barcodes->generateCode128Svg($value),
                ];
            }
        } else {
            $barcodeData = $this->barcodes->forProduct($product);
            $labels = array_fill(0, 8, [
                'name'          => $product->name,
                'sku'           => $product->sku,
                'barcode_value' => $barcodeData['barcode_value'],
                'code128'       => $barcodeData['code128'],
            ]);
        }

        $pdf = Pdf::loadView('pdf.label-sheet', [
            'labels'  => $labels,
            'product' => $product,
        ]);

        $pdf->setPaper('a4', 'portrait');

        return $pdf->download("labels-{$product->sku}.pdf");
    }
}
