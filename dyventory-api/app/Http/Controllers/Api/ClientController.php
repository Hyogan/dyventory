<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreClientRequest;
use App\Http\Requests\UpdateClientRequest;
use App\Http\Resources\ClientResource;
use App\Models\Client;
use App\Services\ClientService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Routing\Controllers\HasMiddleware;
use Illuminate\Routing\Controllers\Middleware;

/**
 * Client CRUD + search + financial summary.
 *
 * GET    /api/v1/clients                    index   (?search, ?is_active, ?type, ?per_page)
 * GET    /api/v1/clients/search             search  (?q)  — autocomplete
 * POST   /api/v1/clients                    store
 * GET    /api/v1/clients/{client}           show
 * GET    /api/v1/clients/{client}/summary   summary — CA + credit stats
 * PUT    /api/v1/clients/{client}           update
 * DELETE /api/v1/clients/{client}           destroy
 */
class ClientController extends Controller implements HasMiddleware
{
    public function __construct(private readonly ClientService $clients) {}

    public static function middleware(): array
    {
        return [new Middleware('auth:sanctum')];
    }

    public function index(Request $request): AnonymousResourceCollection
    {
        $this->authorize('viewAny', Client::class);

        return ClientResource::collection(
            $this->clients->list($request->only(['search', 'is_active', 'type', 'per_page']))
        );
    }

    /** Lightweight autocomplete — returns up to 15 matching active clients. */
    public function search(Request $request): JsonResponse
    {
        $this->authorize('viewAny', Client::class);

        $results = $this->clients->search((string) $request->query('q', ''));

        return response()->json(['data' => ClientResource::collection($results)]);
    }

    public function store(StoreClientRequest $request): JsonResponse
    {
        $this->authorize('create', Client::class);

        $client = $this->clients->create($request->validated());

        return (new ClientResource($client))
            ->response()
            ->setStatusCode(201);
    }

    public function show(Client $client): ClientResource
    {
        $this->authorize('view', $client);

        return new ClientResource($client);
    }

    /** Financial summary: CA, credit balance, purchase count. */
    public function summary(Client $client): JsonResponse
    {
        $this->authorize('view', $client);

        return response()->json(['data' => $this->clients->summary($client)]);
    }

    public function update(UpdateClientRequest $request, Client $client): ClientResource
    {
        $this->authorize('update', $client);

        return new ClientResource($this->clients->update($client, $request->validated()));
    }

    public function destroy(Client $client): JsonResponse
    {
        $this->authorize('delete', $client);

        $this->clients->delete($client);

        return response()->json(null, 204);
    }
}
