<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: DejaVu Sans, sans-serif; font-size: 10px; color: #1a1a1a; padding: 20px; }
        h1 { font-size: 16px; margin-bottom: 4px; }
        .subtitle { color: #6b7280; margin-bottom: 20px; font-size: 9px; }
        table { width: 100%; border-collapse: collapse; }
        th { background: #1e3a5f; color: #fff; padding: 6px 8px; text-align: left; font-size: 9px; }
        td { padding: 5px 8px; border-bottom: 1px solid #e5e7eb; font-size: 9px; }
        tr:nth-child(even) td { background: #f9fafb; }
        .num { text-align: right; }
        .footer { margin-top: 16px; font-size: 8px; color: #9ca3af; text-align: right; }
    </style>
</head>
<body>
    <h1>VAT (TVA) Report</h1>
    <p class="subtitle">Period: {{ $from }} → {{ $to }}</p>

    <table>
        <thead>
            <tr>
                <th>Period</th>
                <th class="num">Sales</th>
                <th class="num">HT</th>
                <th class="num">TVA Collected</th>
                <th class="num">TTC</th>
            </tr>
        </thead>
        <tbody>
            @foreach ($rows as $row)
            <tr>
                <td>{{ $row['period'] }}</td>
                <td class="num">{{ $row['sale_count'] }}</td>
                <td class="num">{{ number_format($row['total_ht'], 2) }}</td>
                <td class="num">{{ number_format($row['total_tva'], 2) }}</td>
                <td class="num">{{ number_format($row['total_ttc'], 2) }}</td>
            </tr>
            @endforeach
        </tbody>
    </table>

    <p class="footer">Generated {{ now()->format('Y-m-d H:i') }}</p>
</body>
</html>
