<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\UpdateSettingRequest;
use App\Http\Resources\SettingResource;
use App\Models\Setting;
use App\Services\SettingService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controllers\HasMiddleware;
use Illuminate\Routing\Controllers\Middleware;

/**
 * Application settings management (admin-only write).
 *
 * GET  /api/v1/settings        index  — all settings grouped
 * PUT  /api/v1/settings        update — bulk update by key
 * POST /api/v1/settings/logo   uploadLogo
 */
class SettingController extends Controller implements HasMiddleware
{
    public function __construct(private readonly SettingService $settings) {}

    public static function middleware(): array
    {
        return [new Middleware('auth:sanctum')];
    }

    /** GET /api/v1/settings — all settings (admin-only). */
    public function index(): JsonResponse
    {
        $this->authorize('viewAny', Setting::class);

        return response()->json([
            'data' => SettingResource::collection($this->settings->all()),
        ]);
    }

    /**
     * PUT /api/v1/settings — bulk update.
     *
     * Body: { "settings": { "company_name": "Acme", "low_stock_threshold": 5, ... } }
     */
    public function update(UpdateSettingRequest $request): JsonResponse
    {
        $this->authorize('update', Setting::class);

        $this->settings->update($request->validated()['settings']);

        return response()->json([
            'data'    => SettingResource::collection($this->settings->all()),
            'message' => 'Settings updated.',
        ]);
    }

    /**
     * POST /api/v1/settings/logo — upload company logo.
     *
     * Replaces existing logo, returns the new public URL.
     */
    public function uploadLogo(Request $request): JsonResponse
    {
        $this->authorize('update', Setting::class);

        $request->validate([
            'logo' => ['required', 'image', 'max:2048', 'mimes:jpeg,jpg,png,webp,svg'],
        ]);

        $path = $this->settings->uploadLogo($request->file('logo'));

        return response()->json([
            'data' => [
                'logo_path' => $path,
                'logo_url'  => asset("storage/{$path}"),
            ],
        ]);
    }
}
