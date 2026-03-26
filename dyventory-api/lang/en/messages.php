<?php

declare(strict_types=1);
return [
    'created'      => ':resource created successfully.',
    'updated'      => ':resource updated successfully.',
    'deleted'      => ':resource deleted successfully.',
    'archived'     => ':resource archived successfully.',
    'not_found'    => ':resource not found.',
    'unauthorized' => 'You are not authorized to perform this action.',
    'validation'   => 'The given data was invalid.',
    'server_error' => 'An unexpected error occurred. Please try again.',
    'unauthenticated' => 'You must be logged in to access this resource.',

    'stock' => [
        'insufficient'  => 'Insufficient stock. Available: :available :unit.',
        'entry_created' => 'Stock entry recorded successfully.',
        'exit_created'  => 'Stock exit recorded successfully.',
        'batch_depleted' => 'Batch :batch is depleted.',
    ],

    'sale' => [
        'created'   => 'Sale :number created successfully.',
        'confirmed' => 'Sale :number confirmed.',
        'cancelled' => 'Sale :number cancelled.',
        'returned'  => 'Return processed for sale :number.',
    ],

    'alerts' => [
        'low_stock'      => ':product is running low. Current stock: :quantity :unit.',
        'stockout'       => ':product is out of stock.',
        'expiry_imminent' => 'Batch :batch of :product expires in :days days.',
        'overdue_credit' => 'Sale :number from :client is overdue by :days days.',
        'mortality'      => 'High mortality rate recorded for :product.',
    ],
];
