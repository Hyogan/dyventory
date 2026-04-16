<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\Supplier;
use App\Models\SupplierOrder;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;

/**
 * Supplier CRUD + summary statistics.
 */
class SupplierService
{
    // ─────────────────────────────────────────────
    // Queries
    // ─────────────────────────────────────────────

    /**
     * Paginated supplier listing.
     *
     * Filters (all optional): search, is_active (bool), per_page
     */
    public function list(array $filters = []): LengthAwarePaginator
    {
        $query = Supplier::orderBy('name');

        if (! empty($filters['search'])) {
            $term = $filters['search'];
            $query->where(static fn ($q) => $q
                ->where('name', 'ilike', "%{$term}%")
                ->orWhere('email', 'ilike', "%{$term}%")
                ->orWhere('contact_person', 'ilike', "%{$term}%")
            );
        }

        if (array_key_exists('is_active', $filters) && $filters['is_active'] !== null) {
            $query->where('is_active', filter_var($filters['is_active'], FILTER_VALIDATE_BOOLEAN));
        }

        $perPage = min((int) ($filters['per_page'] ?? 20), 100);

        return $query->paginate($perPage);
    }

    /**
     * Lightweight autocomplete — active suppliers only.
     *
     * @return Collection<int, Supplier>
     */
    public function search(string $term, int $limit = 15): Collection
    {
        return Supplier::active()
            ->where(static fn ($q) => $q
                ->where('name', 'ilike', "%{$term}%")
                ->orWhere('contact_person', 'ilike', "%{$term}%")
            )
            ->select(['id', 'name', 'email', 'phone', 'contact_person', 'lead_time_days'])
            ->limit($limit)
            ->get();
    }

    public function find(int $id): Supplier
    {
        return Supplier::findOrFail($id);
    }

    /**
     * Procurement summary for a single supplier:
     *  - order_count:    total orders ever placed
     *  - received_count: fully received orders
     *  - pending_count:  sent/confirmed (awaiting delivery)
     *  - total_spend:    sum of received order amounts
     */
    public function summary(Supplier $supplier): array
    {
        $stats = SupplierOrder::where('supplier_id', $supplier->id)
            ->selectRaw("
                COUNT(*)                                                      AS order_count,
                COUNT(CASE WHEN status = 'received' THEN 1 END)               AS received_count,
                COUNT(CASE WHEN status IN ('sent','confirmed') THEN 1 END)    AS pending_count,
                COALESCE(SUM(CASE WHEN status = 'received' THEN total_amount ELSE 0 END), 0)
                                                                              AS total_spend
            ")
            ->first();

        return [
            'order_count'          => (int) ($stats->order_count ?? 0),
            'received_count'       => (int) ($stats->received_count ?? 0),
            'pending_count'        => (int) ($stats->pending_count ?? 0),
            'total_spend'          => round((float) ($stats->total_spend ?? 0), 2),
            'lead_time_days'       => $supplier->lead_time_days,
            'minimum_order_amount' => (float) $supplier->minimum_order_amount,
        ];
    }

    // ─────────────────────────────────────────────
    // Mutations
    // ─────────────────────────────────────────────

    public function create(array $data): Supplier
    {
        return Supplier::create($data);
    }

    public function update(Supplier $supplier, array $data): Supplier
    {
        $supplier->update($data);

        return $supplier->refresh();
    }

    public function delete(Supplier $supplier): void
    {
        $supplier->delete();
    }
}
