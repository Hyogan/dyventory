<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\Promotion;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;

class PromotionService
{
    /** Paginated list with optional search / type / status filters. */
    public function list(array $params): LengthAwarePaginator
    {
        $query = Promotion::query()->latest();

        if (!empty($params['search'])) {
            $query->search($params['search']);
        }

        if (isset($params['type']) && $params['type'] !== '') {
            $query->where('type', $params['type']);
        }

        if (isset($params['is_active']) && $params['is_active'] !== '') {
            $query->where('is_active', filter_var($params['is_active'], FILTER_VALIDATE_BOOLEAN));
        }

        return $query->paginate((int) ($params['per_page'] ?? 25));
    }

    /** All promotions that are active right now (for POS use). */
    public function active(): Collection
    {
        return Promotion::active()->orderBy('name')->get();
    }

    public function create(array $data): Promotion
    {
        return Promotion::create($data);
    }

    public function update(Promotion $promotion, array $data): Promotion
    {
        $promotion->update($data);

        return $promotion->fresh();
    }

    public function delete(Promotion $promotion): void
    {
        $promotion->delete();
    }
}
