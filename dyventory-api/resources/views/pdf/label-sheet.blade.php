<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Label Sheet — {{ $product->name }}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        @page {
            size: A4 portrait;
            margin: 10mm;
        }

        body {
            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
            font-size: 10px;
            color: #111;
        }

        .grid {
            display: table;
            width: 100%;
            border-collapse: collapse;
        }

        .row {
            display: table-row;
        }

        .cell {
            display: table-cell;
            width: 25%;
            height: 35mm;
            padding: 4mm;
            border: 0.5px dashed #ccc;
            text-align: center;
            vertical-align: middle;
            overflow: hidden;
        }

        .label-name {
            font-weight: bold;
            font-size: 9px;
            margin-bottom: 3px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            max-width: 100%;
        }

        .label-barcode {
            margin: 4px auto;
        }

        .label-barcode svg {
            max-width: 90%;
            height: 30px;
        }

        .label-sku {
            font-size: 8px;
            color: #555;
            font-family: monospace;
        }

        .label-value {
            font-size: 7px;
            color: #888;
            margin-top: 2px;
        }
    </style>
</head>
<body>
    <div class="grid">
        @foreach (array_chunk($labels, 4) as $row)
            <div class="row">
                @foreach ($row as $label)
                    <div class="cell">
                        <div class="label-name">{{ $label['name'] }}</div>
                        <div class="label-barcode">{!! $label['code128'] !!}</div>
                        <div class="label-sku">{{ $label['sku'] }}</div>
                        <div class="label-value">{{ $label['barcode_value'] }}</div>
                    </div>
                @endforeach
                {{-- Fill remaining cells in incomplete rows --}}
                @for ($i = count($row); $i < 4; $i++)
                    <div class="cell"></div>
                @endfor
            </div>
        @endforeach
    </div>
</body>
</html>
