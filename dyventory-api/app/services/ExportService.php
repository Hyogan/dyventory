<?php

declare(strict_types=1);

namespace App\Services;

use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Response;
use Illuminate\Support\Str;
use OpenSpout\Common\Entity\Cell;
use OpenSpout\Common\Entity\Row;
use OpenSpout\Writer\XLSX\Writer;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ExportService
{
    /**
     * Stream a CSV response from a 2D array of rows.
     *
     * @param  array<int, array<string, mixed>>  $rows
     * @param  list<string>                      $headers
     */
    public function csv(string $filename, array $headers, array $rows): StreamedResponse
    {
        $filename = $this->sanitize($filename) . '.csv';

        return response()->streamDownload(function () use ($headers, $rows): void {
            $handle = fopen('php://output', 'w');

            // BOM for Excel UTF-8 compatibility
            fwrite($handle, "\xEF\xBB\xBF");

            // Header row
            fputcsv($handle, $headers, ';');

            foreach ($rows as $row) {
                fputcsv($handle, array_values($row), ';');
            }

            fclose($handle);
        }, $filename, [
            'Content-Type'        => 'text/csv; charset=UTF-8',
            'Content-Disposition' => 'attachment; filename="' . $filename . '"',
        ]);
    }

    /**
     * Stream an XLSX response from a 2D array of rows.
     *
     * @param  array<int, array<string, mixed>>  $rows
     * @param  list<string>                      $headers
     */
    public function xlsx(string $filename, array $headers, array $rows): StreamedResponse
    {
        $filename = $this->sanitize($filename) . '.xlsx';
        $tmpPath  = sys_get_temp_dir() . '/' . uniqid('export_', true) . '.xlsx';

        $writer = new Writer();
        $writer->openToFile($tmpPath);
        $writer->addRow($this->makeRow($headers));

        foreach ($rows as $row) {
            $writer->addRow($this->makeRow(array_values($row)));
        }

        $writer->close();

        return response()->download($tmpPath, $filename, [
            'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        ])->deleteFileAfterSend(true);
    }

    /**
     * Generate a PDF response from a Blade view.
     *
     * @param  array<string, mixed>  $data
     */
    public function pdf(string $filename, string $view, array $data): Response
    {
        $filename = $this->sanitize($filename) . '.pdf';

        $pdf = Pdf::loadView($view, $data)
            ->setPaper('a4', 'landscape');

        return $pdf->download($filename);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    /** Build an OpenSpout Row from a flat array of scalar values (v5 API). */
    private function makeRow(array $values): Row
    {
        $cells = array_map(
            fn (mixed $v): Cell => Cell::fromValue($v),
            $values,
        );

        return new Row($cells);
    }

    private function sanitize(string $name): string
    {
        return Str::slug($name);
    }
}
