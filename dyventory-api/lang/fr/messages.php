<?php

declare(strict_types=1);
return [
    'created'      => ':resource créé(e) avec succès.',
    'updated'      => ':resource mis(e) à jour avec succès.',
    'deleted'      => ':resource supprimé(e) avec succès.',
    'archived'     => ':resource archivé(e) avec succès.',
    'not_found'    => ':resource introuvable.',
    'unauthorized' => 'Vous n\'êtes pas autorisé(e) à effectuer cette action.',
    'validation'   => 'Les données fournies sont invalides.',
    'server_error' => 'Une erreur inattendue est survenue. Veuillez réessayer.',
    'unauthenticated' => 'Vous devez être connecté(e) pour accéder à cette ressource.',

    'stock' => [
        'insufficient'  => 'Stock insuffisant. Disponible : :available :unit.',
        'entry_created' => 'Entrée de stock enregistrée avec succès.',
        'exit_created'  => 'Sortie de stock enregistrée avec succès.',
        'batch_depleted' => 'Le lot :batch est épuisé.',
    ],

    'sale' => [
        'created'   => 'Vente :number créée avec succès.',
        'confirmed' => 'Vente :number confirmée.',
        'cancelled' => 'Vente :number annulée.',
        'returned'  => 'Retour traité pour la vente :number.',
    ],

    'alerts' => [
        'low_stock'      => ':product est en stock faible. Stock actuel : :quantity :unit.',
        'stockout'       => ':product est en rupture de stock.',
        'expiry_imminent' => 'Le lot :batch de :product expire dans :days jours.',
        'overdue_credit' => 'La vente :number de :client est en retard de :days jours.',
        'mortality'      => 'Taux de mortalité élevé enregistré pour :product.',
    ],
];
