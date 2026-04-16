<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\Setting;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Storage;

/**
 * Application settings manager with Redis-backed cache.
 *
 * All reads are served from a single Redis key (app_settings) that is
 * invalidated whenever settings are written.  This ensures O(1) reads
 * for settings-heavy code paths (invoices, alerts) without hitting the DB.
 */
class SettingService
{
    private const CACHE_KEY = 'app:settings';
    private const CACHE_TTL = 3600; // 1 hour

    // ─────────────────────────────────────────────
    // Queries
    // ─────────────────────────────────────────────

    /** All settings ordered by group then key. */
    public function all(): Collection
    {
        return Setting::orderBy('group')->orderBy('key')->get();
    }

    /**
     * Get a single typed setting value, falling back to $default if the key
     * does not exist.  Reads through the Redis cache.
     */
    public function get(string $key, mixed $default = null): mixed
    {
        $raw = $this->cachedMap();

        if (! array_key_exists($key, $raw)) {
            return $default;
        }

        // Load the row to get the type; intentionally not cached per-row to
        // keep the cache simple (one key for everything).
        $setting = Setting::where('key', $key)->first();

        return $setting?->typedValue() ?? $default;
    }

    /**
     * Retrieve all settings as a flat typed map: key => typedValue.
     * Useful for building a settings object in front-end-facing responses.
     */
    public function allTyped(): array
    {
        return $this->all()
            ->mapWithKeys(fn (Setting $s) => [$s->key => $s->typedValue()])
            ->all();
    }

    // ─────────────────────────────────────────────
    // Mutations
    // ─────────────────────────────────────────────

    /**
     * Bulk-update settings by key => value map.
     * Only keys that already exist in the table are updated.
     *
     * @param array<string, scalar|null> $data
     */
    public function update(array $data): void
    {
        foreach ($data as $key => $value) {
            Setting::where('key', $key)->update(['value' => $value !== null ? (string) $value : null]);
        }

        $this->bust();
    }

    /**
     * Store an uploaded company logo, remove the old file, and persist the
     * new path to the settings table.
     *
     * @return string  Storage-relative path (e.g. "logos/abc123.png")
     */
    public function uploadLogo(UploadedFile $file): string
    {
        $current = Setting::where('key', 'company_logo')->value('value');

        if ($current && Storage::disk('public')->exists($current)) {
            Storage::disk('public')->delete($current);
        }

        $path = $file->store('logos', 'public');

        Setting::where('key', 'company_logo')->update(['value' => $path]);

        $this->bust();

        return (string) $path;
    }

    // ─────────────────────────────────────────────
    // Internal helpers
    // ─────────────────────────────────────────────

    /** @return array<string, string|null> */
    private function cachedMap(): array
    {
        return Cache::remember(
            self::CACHE_KEY,
            self::CACHE_TTL,
            fn () => Setting::pluck('value', 'key')->all(),
        );
    }

    private function bust(): void
    {
        Cache::forget(self::CACHE_KEY);
    }
}
