<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Facture {{ $sale->sale_number }}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }

        @page { size: A4 portrait; margin: 0; }

        body {
            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
            font-size: 11px;
            color: #111827;
            background: #ffffff;
        }

        /* ── Header band ────────────────────────────────────── */
        .header-band {
            background: #1e40af;
            padding: 28px 32px 24px;
            display: table;
            width: 100%;
        }
        .header-left  { display: table-cell; vertical-align: middle; }
        .header-right { display: table-cell; vertical-align: middle; text-align: right; }

        .company-name { font-size: 20px; font-weight: 700; color: #ffffff; margin-bottom: 5px; }
        .company-meta { font-size: 9.5px; color: rgba(255,255,255,0.7); line-height: 1.65; }

        .invoice-eyebrow {
            font-size: 8.5px;
            font-weight: 700;
            letter-spacing: 2px;
            text-transform: uppercase;
            color: rgba(255,255,255,0.55);
            margin-bottom: 4px;
        }
        .invoice-number { font-size: 22px; font-weight: 700; color: #ffffff; margin-bottom: 4px; }
        .invoice-date   { font-size: 9.5px; color: rgba(255,255,255,0.7); margin-bottom: 8px; }

        .status-pill {
            display: inline-block;
            padding: 3px 10px;
            border-radius: 999px;
            font-size: 8px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.8px;
            border: 1.5px solid rgba(255,255,255,0.45);
            color: #ffffff;
        }

        /* ── Body ───────────────────────────────────────────── */
        .body { padding: 26px 32px; }

        /* ── Parties section ────────────────────────────────── */
        .parties {
            display: table;
            width: 100%;
            margin-bottom: 26px;
        }
        .party-left  { display: table-cell; width: 55%; vertical-align: top; }
        .party-right { display: table-cell; width: 45%; vertical-align: top; text-align: right; }

        .section-label {
            font-size: 8px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 1.2px;
            color: #9ca3af;
            margin-bottom: 7px;
        }
        .client-name { font-size: 13px; font-weight: 700; color: #111827; margin-bottom: 4px; }
        .client-meta { font-size: 10px; color: #6b7280; line-height: 1.65; }

        .meta-line { font-size: 10px; color: #6b7280; margin-bottom: 3px; }
        .meta-line strong { color: #111827; font-weight: 600; }

        /* ── Divider ────────────────────────────────────────── */
        .divider { border: none; border-top: 1px solid #e5e7eb; margin: 0 0 22px; }

        /* ── Items table ────────────────────────────────────── */
        table.items { width: 100%; border-collapse: collapse; margin-bottom: 22px; }

        table.items thead tr { background: #1e40af; }
        table.items th {
            padding: 9px 10px;
            text-align: left;
            font-size: 8px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.8px;
            color: #ffffff;
        }
        table.items th.right { text-align: right; }

        table.items tbody tr:nth-child(even) { background: #f0f5ff; }
        table.items td {
            padding: 9px 10px;
            font-size: 10.5px;
            border-bottom: 1px solid #e5e7eb;
            color: #111827;
            vertical-align: middle;
        }
        table.items td.right  { text-align: right; }
        table.items td.muted  { color: #9ca3af; font-size: 9.5px; }
        table.items tr:last-child td { border-bottom: none; }

        .sku { font-size: 9px; color: #9ca3af; display: block; margin-top: 2px; }

        /* ── Totals block ───────────────────────────────────── */
        .totals-wrap {
            width: 270px;
            margin-left: auto;
            border: 1px solid #e5e7eb;
        }
        .totals-body { padding: 14px 16px 10px; }
        .totals-row {
            display: table;
            width: 100%;
            margin-bottom: 7px;
        }
        .totals-lbl { display: table-cell; font-size: 10px; color: #6b7280; }
        .totals-val { display: table-cell; text-align: right; font-size: 10px; color: #111827; font-weight: 500; }
        .totals-paid .totals-val { color: #16a34a; }
        .totals-due  .totals-val { color: #dc2626; font-weight: 700; }

        .totals-total-row {
            background: #1e40af;
            padding: 13px 16px;
            display: table;
            width: 100%;
        }
        .totals-total-lbl {
            display: table-cell;
            font-size: 10.5px;
            font-weight: 700;
            color: rgba(255,255,255,0.8);
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        .totals-total-val {
            display: table-cell;
            text-align: right;
            font-size: 16px;
            font-weight: 700;
            color: #ffffff;
        }

        /* ── Payment history ────────────────────────────────── */
        .payment-section { margin-top: 26px; }
        .payment-row { display: table; width: 100%; margin-bottom: 4px; }
        .payment-row span { display: table-cell; font-size: 10px; color: #374151; }
        .payment-row span.amount { text-align: right; color: #16a34a; font-weight: 600; }

        /* ── Notes ──────────────────────────────────────────── */
        .notes-box {
            margin-top: 22px;
            padding: 11px 14px;
            background: #fefce8;
            border-left: 3px solid #fbbf24;
            font-size: 10px;
            color: #78350f;
            line-height: 1.6;
        }

        /* ── Footer band ────────────────────────────────────── */
        .footer {
            margin-top: 32px;
            background: #f3f4f6;
            border-top: 1px solid #e5e7eb;
            padding: 10px 32px;
            display: table;
            width: 100%;
        }
        .footer-left  { display: table-cell; font-size: 8.5px; color: #9ca3af; vertical-align: middle; }
        .footer-right { display: table-cell; text-align: right; font-size: 8.5px; color: #9ca3af; vertical-align: middle; }
    </style>
</head>
<body>

{{-- ── Header band ─────────────────────────────────────────── --}}
<div class="header-band">
    <div class="header-left">
        <div class="company-name">{{ $companyName ?? 'Dyventory' }}</div>
        <div class="company-meta">
            @if(!empty($companyAddress)){{ $companyAddress }}<br>@endif
            @if(!empty($companyPhone))Tél : {{ $companyPhone }}<br>@endif
            @if(!empty($companyEmail)){{ $companyEmail }}@endif
        </div>
    </div>
    <div class="header-right">
        <div class="invoice-eyebrow">Facture</div>
        <div class="invoice-number">{{ $sale->sale_number }}</div>
        <div class="invoice-date">{{ $sale->created_at->format('d/m/Y') }}</div>
        <span class="status-pill">{{ ucfirst($sale->status->value) }}</span>
    </div>
</div>

{{-- ── Body ─────────────────────────────────────────────────── --}}
<div class="body">

    {{-- Parties --}}
    <div class="parties">
        <div class="party-left">
            <div class="section-label">Facturer à</div>
            @if($sale->client)
                <div class="client-name">{{ $sale->client->name }}</div>
                <div class="client-meta">
                    @if($sale->client->email){{ $sale->client->email }}<br>@endif
                    @if($sale->client->phone){{ $sale->client->phone }}<br>@endif
                    @if($sale->client->address){{ $sale->client->address }}@endif
                </div>
            @else
                <div class="client-name">Vente au comptoir</div>
                <div class="client-meta">Client anonyme</div>
            @endif
        </div>
        <div class="party-right">
            <div class="section-label">Détails</div>
            <div class="meta-line">Date &nbsp;&nbsp;&nbsp;&nbsp;&nbsp; <strong>{{ $sale->created_at->format('d/m/Y') }}</strong></div>
            @if($sale->due_date)
            <div class="meta-line">Échéance &nbsp; <strong>{{ \Carbon\Carbon::parse($sale->due_date)->format('d/m/Y') }}</strong></div>
            @endif
            @if($sale->payment_method)
            <div class="meta-line">Paiement &nbsp; <strong>{{ ucwords(str_replace('_', ' ', $sale->payment_method)) }}</strong></div>
            @endif
        </div>
    </div>

    <hr class="divider">

    {{-- Items table --}}
    <table class="items">
        <thead>
            <tr>
                <th style="width:44%;">Produit</th>
                <th class="right" style="width:9%;">Qté</th>
                <th class="right" style="width:13%;">P.U. HT</th>
                <th class="right" style="width:8%;">TVA</th>
                <th class="right" style="width:10%;">Remise</th>
                <th class="right" style="width:16%;">Total TTC</th>
            </tr>
        </thead>
        <tbody>
            @foreach($sale->items as $item)
            <tr>
                <td>
                    <strong>{{ $item->product->name ?? "Produit #{$item->product_id}" }}</strong>
                    @if($item->product?->sku)
                        <span class="sku">{{ $item->product->sku }}</span>
                    @endif
                </td>
                <td class="right">
                    {{ number_format((float)$item->quantity, 2) }}
                    <span class="muted">{{ $item->product?->unit_of_measure }}</span>
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

    {{-- Totals --}}
    <div class="totals-wrap">
        <div class="totals-body">
            <div class="totals-row">
                <span class="totals-lbl">Sous-total HT</span>
                <span class="totals-val">{{ number_format((float)$sale->subtotal_ht, 0, ',', ' ') }} F</span>
            </div>
            <div class="totals-row">
                <span class="totals-lbl">TVA</span>
                <span class="totals-val">{{ number_format((float)$sale->total_vat, 0, ',', ' ') }} F</span>
            </div>
            @if((float)$sale->discount_amount > 0)
            <div class="totals-row">
                <span class="totals-lbl">Remise</span>
                <span class="totals-val" style="color:#16a34a;">−{{ number_format((float)$sale->discount_amount, 0, ',', ' ') }} F</span>
            </div>
            @endif
            @if((float)$sale->amount_paid > 0)
            <div class="totals-row totals-paid">
                <span class="totals-lbl">Déjà réglé</span>
                <span class="totals-val">{{ number_format((float)$sale->amount_paid, 0, ',', ' ') }} F</span>
            </div>
            @endif
            @if((float)$sale->amount_due > 0)
            <div class="totals-row totals-due" style="padding-bottom:4px;">
                <span class="totals-lbl">Reste à payer</span>
                <span class="totals-val">{{ number_format((float)$sale->amount_due, 0, ',', ' ') }} F</span>
            </div>
            @endif
        </div>
        <div class="totals-total-row">
            <span class="totals-total-lbl">Total TTC</span>
            <span class="totals-total-val">{{ number_format((float)$sale->total_ttc, 0, ',', ' ') }} F</span>
        </div>
    </div>

    {{-- Payment history --}}
    @if($sale->payments && $sale->payments->count() > 0)
    <div class="payment-section">
        <div class="section-label" style="margin-bottom:8px;">Historique des paiements</div>
        @foreach($sale->payments as $payment)
        <div class="payment-row">
            <span>{{ \Carbon\Carbon::parse($payment->paid_at)->format('d/m/Y') }} — {{ ucwords(str_replace('_', ' ', $payment->payment_method)) }}</span>
            <span class="amount">+{{ number_format((float)$payment->amount, 0, ',', ' ') }} F</span>
        </div>
        @endforeach
    </div>
    @endif

    {{-- Notes --}}
    @if($sale->notes)
    <div class="notes-box">
        <strong>Note :</strong> {{ $sale->notes }}
    </div>
    @endif

</div>

{{-- ── Footer band ──────────────────────────────────────────── --}}
<div class="footer">
    <div class="footer-left">
        Généré le {{ now()->format('d/m/Y à H:i') }}
    </div>
    <div class="footer-right">
        {{ $companyName ?? 'Dyventory' }}@if(!empty($invoiceFooter)) · {{ $invoiceFooter }}@endif
    </div>
</div>

</body>
</html>
