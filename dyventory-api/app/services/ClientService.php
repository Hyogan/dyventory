<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\Client;
use App\Models\Sale;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;

/**
 * Client CRUD + business logic.
 *
 * Responsibilities:
 *  - Paginated / filtered client listing
 *  - Autocomplete search (debounced dropdown)
 *  - Financial summary (CA, credit, purchase count)
 *  - CRUD mutations
 */
class ClientService
{
    // ─────────────────────────────────────────────
    // Queries
    // ─────────────────────────────────────────────

    /**
     * Paginated client listing.
     *
     * Filters (all optional):
     *   search, is_active (bool), type (individual|company), per_page
     */
    public function list(array $filters = []): LengthAwarePaginator
    {
        $query = Client::orderBy('name');

        if (! empty($filters['search'])) {
            $query->search($filters['search']);
        }

        if (array_key_exists('is_active', $filters) && $filters['is_active'] !== null) {
            $query->where('is_active', filter_var($filters['is_active'], FILTER_VALIDATE_BOOLEAN));
        }

        if (! empty($filters['type'])) {
            $query->where('type', $filters['type']);
        }

        $perPage = min((int) ($filters['per_page'] ?? 20), 100);

        return $query->paginate($perPage);
    }

    /**
     * Lightweight autocomplete search — no pagination, active clients only.
     *
     * @return Collection<int, Client>
     */
    public function search(string $term, int $limit = 15): Collection
    {
        return Client::active()
            ->search($term)
            ->select(['id', 'name', 'email', 'phone', 'outstanding_balance', 'credit_limit', 'type'])
            ->limit($limit)
            ->get();
    }

    public function find(int $id): Client
    {
        return Client::findOrFail($id);
    }

    /**
     * Financial summary for a single client.
     *
     * Returns:
     *  - sale_count:          total confirmed/delivered sales
     *  - total_revenue:       sum of total_ttc across confirmed/delivered sales
     *  - total_paid:          total amount actually received
     *  - outstanding_balance: current credit owed (from Client model)
     *  - credit_limit:        maximum allowed outstanding credit
     *  - available_credit:    credit_limit − outstanding_balance (floor 0)
     */
    public function summary(Client $client): array
    {
        $stats = Sale::where('client_id', $client->id)
            ->whereIn('status', ['confirmed', 'delivered'])
            ->selectRaw('
                COUNT(*)                        AS sale_count,
                COALESCE(SUM(total_ttc), 0)     AS total_revenue,
                COALESCE(SUM(amount_paid), 0)   AS total_paid
            ')
            ->first();

        return [
            'sale_count'          => (int) ($stats->sale_count ?? 0),
            'total_revenue'       => round((float) ($stats->total_revenue ?? 0), 2),
            'total_paid'          => round((float) ($stats->total_paid ?? 0), 2),
            'outstanding_balance' => (float) $client->outstanding_balance,
            'credit_limit'        => (float) $client->credit_limit,
            'available_credit'    => max(0.0, round((float) $client->credit_limit - (float) $client->outstanding_balance, 2)),
        ];
    }

    // ─────────────────────────────────────────────
    // Mutations
    // ─────────────────────────────────────────────

    public function create(array $data): Client
    {
        return Client::create($data);
    }

    public function update(Client $client, array $data): Client
    {
        $client->update($data);

        return $client->refresh();
    }

    public function delete(Client $client): void
    {
        $client->delete();
    }
}
