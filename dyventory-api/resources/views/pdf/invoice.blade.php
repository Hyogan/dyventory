<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Invoice {{ $sale->sale_number }}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        @page { size: A4 portrait; margin: 15mm 15mm 20mm 15mm; }
        body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 11px; color: #1a1a1a; }

        .header { display: table; width: 100%; margin-bottom: 30px; }
        .header-left { display: table-cell; width: 60%; vertical-align: top; }
        .header-right { display: table-cell; width: 40%; vertical-align: top; text-align: right; }

        .company-name { font-size: 22px; font-weight: 700; color: #1a1a1a; margin-bottom: 4px; }
        .company-meta { font-size: 10px; color: #666; line-height: 1.6; }

        .invoice-title { font-size: 28px; font-weight: 700; color: #2563eb; letter-spacing: -0.5px; }
        .invoice-number { font-size: 13px; font-weight: 600; color: #1a1a1a; margin-top: 4px; }
        .invoice-date { font-size: 10px; color: #666; margin-top: 2px; }

        .divider { border: none; border-top: 2px solid #e5e7eb; margin: 20px 0; }

        .parties { display: table; width: 100%; margin-bottom: 25px; }
        .party { display: table-cell; width: 50%; vertical-align: top; }
        .party-label { font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.8px; color: #9ca3af; margin-bottom: 6px; }
        .party-name { font-size: 12px; font-weight: 600; color: #1a1a1a; margin-bottom: 2px; }
        .party-meta { font-size: 10px; color: #555; line-height: 1.6; }

        table.items { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        table.items thead tr { background: #f3f4f6; }
        table.items th { padding: 8px 10px; text-align: left; font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: #6b7280; }
        table.items th.right { text-align: right; }
        table.items td { padding: 9px 10px; font-size: 10.5px; border-bottom: 1px solid #f3f4f6; }
        table.items td.right { text-align: right; }
        table.items td.muted { color: #6b7280; }
        table.items tr:last-child td { border-bottom: none; }

        .totals { width: 260px; margin-left: auto; }
        .totals-row { display: table; width: 100%; padding: 4px 0; }
        .totals-label { display: table-cell; font-size: 10px; color: #555; }
        .totals-value { display: table-cell; text-align: right; font-size: 10px; color: #1a1a1a; }
        .totals-row.total { border-top: 2px solid #e5e7eb; padding-top: 8px; margin-top: 4px; }
        .totals-row.total .totals-label { font-weight: 700; font-size: 12px; color: #1a1a1a; }
        .totals-row.total .totals-value { font-weight: 700; font-size: 14px; color: #2563eb; }
        .totals-row.paid .totals-value { color: #16a34a; }
        .totals-row.due .totals-value { color: #dc2626; font-weight: 600; }

        .payment-info { margin-top: 25px; padding: 12px; background: #f9fafb; border-radius: 6px; }
        .payment-info-label { font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.8px; color: #9ca3af; margin-bottom: 6px; }
        .payment-row { display: table; width: 100%; margin-bottom: 3px; }
        .payment-row span { display: table-cell; font-size: 10px; }
        .payment-row span:last-child { text-align: right; color: #16a34a; font-weight: 600; }

        .footer { margin-top: 30px; padding-top: 12px; border-top: 1px solid #e5e7eb; font-size: 9px; color: #9ca3af; text-align: center; }

        .status-badge { display: inline-block; padding: 2px 8px; border-radius: 999px; font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; }
        .status-draft { background: #f3f4f6; color: #6b7280; }
        .status-confirmed { background: #dbeafe; color: #1d4ed8; }
        .status-delivered { background: #dcfce7; color: #15803d; }
        .status-cancelled { background: #fee2e2; color: #dc2626; }
    </style>
</head>
<body>

<div class="header">
    <div class="header-left">
        <div class="company-name">{{ $companyName ?? 'Dyventory' }}</div>
        @if(!empty($companyAddress))
        <div class="company-meta">
            {{ $companyAddress }}<br>
            @if(!empty($companyPhone)) Tél : {{ $companyPhone }}<br>@endif
            @if(!empty($companyEmail)) {{ $companyEmail }}@endif
        </div>
        @endif
    </div>
    <div class="header-right">
        <div class="invoice-title">INVOICE</div>
        <div class="invoice-number">{{ $sale->sale_number }}</div>
        <div class="invoice-date">{{ $sale->created_at->format('d/m/Y') }}</div>
        <div style="margin-top:6px;">
            <span class="status-badge status-{{ $sale->status }}">{{ ucfirst($sale->status) }}</span>
        </div>
    </div>
</div>

<hr class="divider">

<div class="parties">
    <div class="party">
        <div class="party-label">From</div>
        <div class="party-name">{{ $companyName ?? 'Dyventory' }}</div>
        @if(!empty($companyAddress))
        <div class="party-meta">{{ $companyAddress }}</div>
        @endif
    </div>
    <div class="party" style="text-align:right;">
        <div class="party-label">Bill To</div>
        @if($sale->client)
        <div class="party-name">{{ $sale->client->name }}</div>
        <div class="party-meta">
            @if($sale->client->email){{ $sale->client->email }}<br>@endif
            @if($sale->client->phone){{ $sale->client->phone }}<br>@endif
            @if($sale->client->address){{ $sale->client->address }}@endif
        </div>
        @else
        <div class="party-name">Walk-in / Anonymous</div>
        @endif
    </div>
</div>

@if($sale->due_date)
<div style="margin-bottom:16px; font-size:10px; color:#555;">
    <strong>Due date:</strong> {{ \Carbon\Carbon::parse($sale->due_date)->format('d/m/Y') }}
    &nbsp;&nbsp;|&nbsp;&nbsp;
    <strong>Payment:</strong> {{ $sale->payment_method ? ucwords(str_replace('_',' ',$sale->payment_method)) : '—' }}
</div>
@endif

<table class="items">
    <thead>
        <tr>
            <th style="width:45%;">Product</th>
            <th class="right" style="width:10%;">Qty</th>
            <th class="right" style="width:12%;">Unit (HT)</th>
            <th class="right" style="width:8%;">VAT</th>
            <th class="right" style="width:10%;">Disc.</th>
            <th class="right" style="width:15%;">Total (TTC)</th>
        </tr>
    </thead>
    <tbody>
        @foreach($sale->items as $item)
        <tr>
            <td>
                <strong>{{ $item->product->name ?? "Product #{$item->product_id}" }}</strong>
                @if($item->product?->sku)
                <br><span class="muted" style="font-size:9px;">{{ $item->product->sku }}</span>
                @endif
            </td>
            <td class="right">
                {{ number_format((float)$item->quantity, 2) }}
                {{ $item->product?->unit_of_measure }}
            </td>
            <td class="right">{{ number_format((float)$item->unit_price_ht, 0, ',', ' ') }} F</td>
            <td class="right muted">{{ $item->vat_rate }}%</td>
            <td class="right muted">
                {{ (float)$item->discount_percent > 0 ? '-'.$item->discount_percent.'%' : '—' }}
            </td>
            <td class="right"><strong>{{ number_format((float)$item->line_total_ttc, 0, ',', ' ') }} F</strong></td>
        </tr>
        @endforeach
    </tbody>
</table>

<div class="totals">
    <div class="totals-row">
        <span class="totals-label">Subtotal HT</span>
        <span class="totals-value">{{ number_format((float)$sale->subtotal_ht, 0, ',', ' ') }} F</span>
    </div>
    <div class="totals-row">
        <span class="totals-label">VAT</span>
        <span class="totals-value">{{ number_format((float)$sale->total_vat, 0, ',', ' ') }} F</span>
    </div>
    @if((float)$sale->discount_amount > 0)
    <div class="totals-row">
        <span class="totals-label">Discount</span>
        <span class="totals-value" style="color:#16a34a;">−{{ number_format((float)$sale->discount_amount, 0, ',', ' ') }} F</span>
    </div>
    @endif
    <div class="totals-row total">
        <span class="totals-label">Total TTC</span>
        <span class="totals-value">{{ number_format((float)$sale->total_ttc, 0, ',', ' ') }} F</span>
    </div>
    @if((float)$sale->amount_paid > 0)
    <div class="totals-row paid" style="padding-top:4px;">
        <span class="totals-label">Paid</span>
        <span class="totals-value">{{ number_format((float)$sale->amount_paid, 0, ',', ' ') }} F</span>
    </div>
    @endif
    @if((float)$sale->amount_due > 0)
    <div class="totals-row due">
        <span class="totals-label">Balance due</span>
        <span class="totals-value">{{ number_format((float)$sale->amount_due, 0, ',', ' ') }} F</span>
    </div>
    @endif
</div>

@if($sale->payments && $sale->payments->count() > 0)
<div class="payment-info">
    <div class="payment-info-label">Payment history</div>
    @foreach($sale->payments as $payment)
    <div class="payment-row">
        <span>{{ \Carbon\Carbon::parse($payment->paid_at)->format('d/m/Y') }} — {{ ucwords(str_replace('_',' ',$payment->payment_method)) }}</span>
        <span>+{{ number_format((float)$payment->amount, 0, ',', ' ') }} F</span>
    </div>
    @endforeach
</div>
@endif

@if($sale->notes)
<div style="margin-top:20px; font-size:10px; color:#555;">
    <strong>Notes:</strong> {{ $sale->notes }}
</div>
@endif

<div class="footer">
    Generated on {{ now()->format('d/m/Y H:i') }} — {{ $companyName ?? 'Dyventory' }}
    @if(!empty($invoiceFooter)) | {{ $invoiceFooter }} @endif
</div>

</body>
</html>
