<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreUserRequest;
use App\Http\Requests\UpdateUserRequest;
use App\Http\Resources\UserResource;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Routing\Controllers\HasMiddleware;
use Illuminate\Routing\Controllers\Middleware;
use Illuminate\Support\Facades\Hash;

/**
 * Admin-only user management.
 *
 * GET    /api/v1/users                  index   (?search, ?role, ?is_active, ?per_page)
 * POST   /api/v1/users                  store
 * GET    /api/v1/users/{user}           show
 * PUT    /api/v1/users/{user}           update
 * DELETE /api/v1/users/{user}           destroy  (soft-delete)
 * POST   /api/v1/users/{user}/restore   restore  (admin re-activates a deleted user)
 */
class UserController extends Controller implements HasMiddleware
{
    public static function middleware(): array
    {
        return [new Middleware('auth:sanctum')];
    }

    public function index(Request $request): AnonymousResourceCollection
    {
        $this->authorize('viewAny', User::class);

        $query = User::withTrashed()->orderBy('name');

        if ($request->filled('search')) {
            $term = $request->string('search');
            $query->where(static fn ($q) => $q
                ->where('name', 'ilike', "%{$term}%")
                ->orWhere('email', 'ilike', "%{$term}%")
            );
        }

        if ($request->filled('role')) {
            $query->where('role', $request->string('role'));
        }

        if ($request->filled('is_active')) {
            $query->where('is_active', $request->boolean('is_active'));
        }

        $perPage = min((int) $request->query('per_page', 20), 100);

        return UserResource::collection($query->paginate($perPage));
    }

    public function store(StoreUserRequest $request): JsonResponse
    {
        $this->authorize('create', User::class);

        $data             = $request->validated();
        $data['password'] = Hash::make($data['password']);

        $user = User::create($data);

        return (new UserResource($user))
            ->response()
            ->setStatusCode(201);
    }

    public function show(User $user): UserResource
    {
        $this->authorize('view', $user);

        return new UserResource($user);
    }

    public function update(UpdateUserRequest $request, User $user): UserResource
    {
        $this->authorize('update', $user);

        $data = $request->validated();

        if (! empty($data['password'])) {
            $data['password'] = Hash::make($data['password']);
        } else {
            unset($data['password']);
        }

        $user->update($data);

        return new UserResource($user->refresh());
    }

    public function destroy(User $user): JsonResponse
    {
        $this->authorize('delete', $user);

        $user->delete();

        return response()->json(null, 204);
    }

    public function restore(User $user): UserResource
    {
        $this->authorize('restore', $user);

        $user->restore();

        return new UserResource($user->refresh());
    }
}
