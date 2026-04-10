<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\Product;

/**
 * Generates barcode SVGs (Code128) and QR code SVGs.
 *
 * Uses the `milon/barcode` package for generation.
 * Falls back to a simple SVG placeholder if the package is not available.
 */
class BarcodeService
{
    /**
     * Generate a Code128 barcode as an SVG string.
     */
    public function generateCode128Svg(string $data, int $width = 2, int $height = 60): string
    {
        if (class_exists(\Milon\Barcode\DNS1D::class)) {
            $generator = new \Milon\Barcode\DNS1D();

            return $generator->getBarcodeSVG($data, 'C128', $width, $height, 'black', false);
        }

        // Fallback: simple SVG text placeholder
        return $this->fallbackSvg($data, $width * 100, $height);
    }

    /**
     * Generate a QR code as an SVG string.
     */
    public function generateQrSvg(string $data, int $size = 4): string
    {
        if (class_exists(\Milon\Barcode\DNS2D::class)) {
            $generator = new \Milon\Barcode\DNS2D();

            return $generator->getBarcodeSVG($data, 'QRCODE,L', $size, $size, 'black', false);
        }

        // Fallback
        return $this->fallbackSvg($data, $size * 40, $size * 40);
    }

    /**
     * Generate barcode data for a product (Code128 + QR).
     *
     * @return array{code128: string, qr: string, barcode_value: string}
     */
    public function forProduct(Product $product): array
    {
        $value = $product->barcode ?? $product->sku;

        return [
            'barcode_value' => $value,
            'code128'       => $this->generateCode128Svg($value),
            'qr'            => $this->generateQrSvg($value),
        ];
    }

    /**
     * Generate label sheet data for multiple products.
     * Returns an array of barcode data, 8 per page (4 columns x 2 rows).
     *
     * @param  Product[]|\Illuminate\Support\Collection  $products
     * @return array<int, array{product: Product, code128: string, qr: string, barcode_value: string}>
     */
    public function labelSheetData(iterable $products): array
    {
        $labels = [];

        foreach ($products as $product) {
            $barcodeData = $this->forProduct($product);
            $labels[] = array_merge(['product' => $product], $barcodeData);
        }

        return $labels;
    }

    /**
     * Simple SVG fallback when barcode library is not installed.
     */
    private function fallbackSvg(string $text, int $width, int $height): string
    {
        $escapedText = htmlspecialchars($text, ENT_XML1);

        return <<<SVG
        <svg xmlns="http://www.w3.org/2000/svg" width="{$width}" height="{$height}" viewBox="0 0 {$width} {$height}">
            <rect width="100%" height="100%" fill="white" stroke="black" stroke-width="1"/>
            <text x="50%" y="50%" text-anchor="middle" dominant-baseline="middle" font-family="monospace" font-size="12">{$escapedText}</text>
        </svg>
        SVG;
    }
}
