# Laravel 13 Reference

## Table of Contents

1. [Routing & Controllers](#routing)
2. [Models & Eloquent](#models)
3. [Form Requests & Validation](#validation)
4. [API Resources](#resources)
5. [Authentication (Sanctum)](#auth)
6. [Jobs & Queues](#jobs)
7. [Events & Listeners](#events)
8. [Policies & Authorization](#policies)
9. [Laravel 13 Specific Features](#laravel13)

---

## What Changed from Laravel 12 → 13

| Area                      | Change                                                            | Impact                                     |
| ------------------------- | ----------------------------------------------------------------- | ------------------------------------------ |
| **PHP minimum**           | 8.2 → **8.3** required                                            | Update runtime before upgrading            |
| **PHPUnit**               | ^11 → **^12** required                                            | Update `composer.json`                     |
| **PHP Attributes**        | 15+ new attribute locations (models, jobs, commands, controllers) | Optional — old property syntax still works |
| **CSRF middleware**       | `VerifyCsrfToken` renamed to `PreventRequestForgery`              | Update any custom exclusions               |
| **Queue routing**         | New `Queue::route()` centralised routing                          | Replace scattered `->onQueue()` calls      |
| **Cache serialization**   | `serializable_classes` defaults to `false`                        | Explicitly list any cached PHP objects     |
| **AI SDK**                | First-party, stable — not beta                                    | New — no breaking change                   |
| **JSON:API Resources**    | First-party `JsonApiResource` class                               | New — no breaking change                   |
| **Cache::touch()**        | New method — extend TTL without read/write                        | New — no breaking change                   |
| **Zero breaking changes** | Confirmed by Taylor Otwell at Laracon EU 2026                     | Upgrade path is under one day              |

---

## Routing & Controllers {#routing}

### API Routes (routes/api.php)

```php
// Always version your API
Route::prefix('v1')->middleware('api')->group(function () {

    // Public routes
    Route::post('/auth/login', [AuthController::class, 'login']);
    Route::post('/auth/register', [AuthController::class, 'register']);

    // Protected routes
    Route::middleware('auth:sanctum')->group(function () {
        Route::apiResource('products', ProductController::class);
        Route::apiResource('sales', SaleController::class)->except(['update']);
        Route::patch('/sales/{sale}/status', [SaleController::class, 'updateStatus']);

        // Nested resources
        Route::apiResource('sales.items', SaleItemController::class)
            ->shallow();
    });
});
```

### Controller Pattern — with Laravel 13 Attribute syntax ⚠️ UPDATED

```php
use Illuminate\Routing\Attributes\Middleware;
use Illuminate\Auth\Attributes\Authorize;
use Illuminate\Routing\Controllers\HasMiddleware;

// Laravel 13: #[Middleware] and #[Authorize] declared as PHP attributes
// Old $this->authorize() and $this->middleware() still work — this is additive
#[Middleware('auth:sanctum')]
class ProductController extends Controller implements HasMiddleware
{
    public function __construct(private ProductService $products) {}

    public function index(IndexProductRequest $request): AnonymousResourceCollection
    {
        $products = $this->products->paginate(
            filters: $request->validated(),
            perPage: $request->integer('per_page', 20)
        );
        return ProductResource::collection($products);
    }

    // Per-method authorization via attribute — replaces $this->authorize()
    #[Authorize('create', Product::class)]
    public function store(StoreProductRequest $request): ProductResource
    {
        $product = $this->products->create($request->validated());
        return new ProductResource($product);
    }

    public function destroy(Product $product): Response
    {
        $this->authorize('delete', $product); // old syntax still works fine
        $this->products->delete($product);
        return response()->noContent();
    }
}
```

---

## Models & Eloquent {#models}

### Model — Laravel 13 PHP Attribute Syntax (preferred for new models) ⚠️ UPDATED

```php
use Illuminate\Database\Eloquent\Attributes\Table;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Attributes\Cast;
use Illuminate\Database\Eloquent\Attributes\UseResource;
use Illuminate\Database\Eloquent\Attributes\UseFactory;
use Illuminate\Database\Eloquent\Attributes\ObservedBy;

// Attributes sit above the class — body is now purely business logic
#[Table('products')]
#[Fillable(['name', 'sku', 'category_id', 'price_sell_ttc', 'price_buy_ht', 'vat_rate_id', 'attributes', 'status'])]
#[Cast('attributes', AsCollection::class)]
#[Cast('price_sell_ttc', 'decimal:2')]
#[Cast('status', ProductStatus::class)]
#[Cast('deleted_at', 'datetime')]
#[UseResource(ProductResource::class)]
#[UseFactory(ProductFactory::class)]
class Product extends Model
{
    use HasFactory, SoftDeletes;

    // Body is now ONLY relations, scopes, and business methods
    public function scopeActive(Builder $query): Builder
    {
        return $query->where('status', ProductStatus::Active);
    }

    public function scopeInCategory(Builder $query, int $categoryId): Builder
    {
        return $query->where('category_id', $categoryId);
    }

    public function scopeLowStock(Builder $query): Builder
    {
        return $query->whereColumn('stock_quantity', '<=', 'stock_alert_threshold');
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    public function variants(): HasMany
    {
        return $this->hasMany(ProductVariant::class);
    }

    public function movements(): HasMany
    {
        return $this->hasMany(StockMovement::class);
    }

    public function getStockValueAttribute(): float
    {
        return $this->stock_quantity * $this->price_buy_ht;
    }
}
```

### Model — Legacy Property Syntax (still fully valid — use when editing existing models)

```php
// DO NOT mix attribute and property syntax in the same class.
// Pick one per model and be consistent.
class Product extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'name', 'sku', 'category_id', 'price_sell_ttc',
        'price_buy_ht', 'vat_rate_id', 'attributes', 'status',
    ];

    protected $casts = [
        'attributes'     => AsCollection::class,
        'price_sell_ttc' => 'decimal:2',
        'status'         => ProductStatus::class,
        'deleted_at'     => 'datetime',
    ];
}
```

### Enum (PHP 8.3+)

```php
enum ProductStatus: string
{
    case Active   = 'active';
    case Archived = 'archived';

    public function label(): string
    {
        return match($this) {
            self::Active   => 'Active',
            self::Archived => 'Archived',
        };
    }
}
```

### Migrations — JSONB for flexible attributes (unchanged)

```php
Schema::create('products', function (Blueprint $table) {
    $table->id();
    $table->string('name');
    $table->string('sku')->unique();
    $table->foreignId('category_id')->constrained()->cascadeOnDelete();
    $table->decimal('price_sell_ttc', 10, 2);
    $table->decimal('price_buy_ht', 10, 2);
    $table->integer('stock_alert_threshold')->default(0);
    $table->jsonb('attributes')->nullable(); // PostgreSQL JSONB
    $table->string('status')->default('active');
    $table->timestamps();
    $table->softDeletes();

    $table->index('category_id');
    $table->index('status');
    $table->index('sku');
});
```

---

## Form Requests & Validation {#validation}

```php
class StoreProductRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('create', Product::class);
    }

    public function rules(): array
    {
        return [
            'name'           => ['required', 'string', 'max:255'],
            'sku'            => ['required', 'string', 'unique:products,sku'],
            'category_id'    => ['required', 'exists:categories,id'],
            'price_sell_ttc' => ['required', 'numeric', 'min:0'],
            'attributes'     => ['nullable', 'array'],
        ];
    }

    public function messages(): array
    {
        return [
            'sku.unique' => 'This reference is already in use.',
        ];
    }
}
```

---

## API Resources {#resources}

### Standard JSON Resource (unchanged)

```php
class ProductResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'             => $this->id,
            'name'           => $this->name,
            'sku'            => $this->sku,
            'price_sell_ttc' => $this->price_sell_ttc,
            'stock_quantity' => $this->stock_quantity,
            'status'         => $this->status,
            'category'       => new CategoryResource($this->whenLoaded('category')),
            'variants'       => ProductVariantResource::collection($this->whenLoaded('variants')),
            'stock_value'    => $this->when(
                $request->user()?->can('viewFinancials'),
                $this->stock_value
            ),
            'created_at' => $this->created_at->toISOString(),
        ];
    }
}
```

### JSON:API Resource (Laravel 13 — first-party) ⚠️ NEW

```php
// For spec-compliant JSON:API responses.
// Handles serialization, relationship inclusion, sparse fieldsets,
// links, and correct Content-Type headers automatically.
use Illuminate\Http\Resources\Json\JsonApiResource;

class ProductJsonApiResource extends JsonApiResource
{
    public function toAttributes(Request $request): array
    {
        return [
            'name'           => $this->name,
            'sku'            => $this->sku,
            'price_sell_ttc' => $this->price_sell_ttc,
            'stock_quantity' => $this->stock_quantity,
            'status'         => $this->status,
        ];
    }

    public function toRelationships(Request $request): array
    {
        return [
            'category' => new CategoryJsonApiResource($this->whenLoaded('category')),
        ];
    }
}

// Returns a full JSON:API-compliant envelope automatically
return new ProductJsonApiResource($product);
```

### Pagination wrapper (unchanged)

```php
class ProductCollection extends ResourceCollection
{
    public function toArray(Request $request): array
    {
        return [
            'data' => $this->collection,
            'meta' => [
                'total'        => $this->total(),
                'per_page'     => $this->perPage(),
                'current_page' => $this->currentPage(),
                'last_page'    => $this->lastPage(),
            ],
        ];
    }
}
```

---

## Authentication (Sanctum) {#auth}

### Login Endpoint

```php
class AuthController extends Controller
{
    public function login(LoginRequest $request): JsonResponse
    {
        $credentials = $request->only('email', 'password');

        if (!Auth::attempt($credentials)) {
            return response()->json(['message' => 'Invalid credentials.'], 401);
        }

        $user  = Auth::user();
        $token = $user->createToken('api-token', $user->role->permissions())->plainTextToken;

        return response()->json([
            'token' => $token,
            'user'  => new UserResource($user),
        ]);
    }

    public function logout(Request $request): Response
    {
        $request->user()->currentAccessToken()->delete();
        return response()->noContent();
    }
}
```

### CSRF — PreventRequestForgery (Laravel 13 rename) ⚠️ UPDATED

```php
// Laravel 13: VerifyCsrfToken → PreventRequestForgery
// Also adds origin verification via Sec-Fetch-Site header (stronger than token-only)
// Old class name still exists as a deprecated alias — but update any explicit references

// bootstrap/app.php — update CSRF exclusion references:
->withMiddleware(function (Middleware $middleware) {
    $middleware->validateCsrfTokens(except: [
        'api/*',  // Our API uses Sanctum token auth, not CSRF
    ]);
})
```

### RBAC Policies (unchanged — always required)

```php
class ProductPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->hasAnyRole(['admin', 'manager', 'vendor', 'warehouse']);
    }

    public function create(User $user): bool
    {
        return $user->hasAnyRole(['admin', 'manager']);
    }

    public function delete(User $user, Product $product): bool
    {
        return $user->hasRole('admin');
    }
}
```

---

## Jobs & Queues {#jobs}

### Job — Laravel 13 Attribute Syntax (preferred for new jobs) ⚠️ UPDATED

```php
use Illuminate\Queue\Attributes\Tries;
use Illuminate\Queue\Attributes\Timeout;
use Illuminate\Queue\Attributes\Backoff;
use Illuminate\Queue\Attributes\FailOnTimeout;
use Illuminate\Queue\Attributes\DeleteWhenMissingModels;

// PHP attributes replace public $tries, $timeout, $backoff properties
#[Tries(3)]
#[Timeout(60)]
#[Backoff(30)]
#[DeleteWhenMissingModels]
class GenerateInvoicePdf implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function __construct(public readonly Sale $sale) {}

    public function handle(PdfService $pdf): void
    {
        $path = $pdf->generateInvoice($this->sale);
        $this->sale->update(['invoice_path' => $path]);
        event(new InvoiceGenerated($this->sale));
    }

    public function failed(Throwable $e): void
    {
        Log::error("Invoice generation failed for sale {$this->sale->id}", [
            'error' => $e->getMessage(),
        ]);
    }
}

// Dispatch syntax unchanged
GenerateInvoicePdf::dispatch($sale);
GenerateInvoicePdf::dispatch($sale)->delay(now()->addSeconds(5));
```

### Centralised Queue Routing — Queue::route() ⚠️ NEW IN 13

```php
// AppServiceProvider::boot() — all queue routing in ONE place
// Replaces scattered ->onQueue('...') and ->onConnection('...') at every dispatch site
// Now just dispatch — routing is handled here centrally

use Illuminate\Support\Facades\Queue;

public function boot(): void
{
    Queue::route(GenerateInvoicePdf::class,     connection: 'redis', queue: 'documents');
    Queue::route(GenerateDeliveryNotePdf::class, connection: 'redis', queue: 'documents');
    Queue::route(GenerateCreditNotePdf::class,   connection: 'redis', queue: 'documents');
    Queue::route(CheckStockAlerts::class,         connection: 'redis', queue: 'alerts');
    Queue::route(CheckOverdueCredits::class,      connection: 'redis', queue: 'alerts');
    Queue::route(ExportReport::class,             connection: 'redis', queue: 'exports');
}

// Dispatch is now clean — no queue/connection specified at call site:
GenerateInvoicePdf::dispatch($sale);   // → redis:documents
CheckStockAlerts::dispatch();          // → redis:alerts
ExportReport::dispatch($filters);      // → redis:exports
```

### Job Batching (unchanged from Laravel 12)

```php
use Illuminate\Bus\Batch;
use Illuminate\Support\Facades\Bus;

$batch = Bus::batch([
    new ProcessStockReport($period),
    new SendLowStockAlerts($products),
    new GenerateSalesExport($period),
])->then(function (Batch $batch) {
    // All succeeded
})->catch(function (Batch $batch, Throwable $e) {
    // Handle partial failure
})->finally(function (Batch $batch) {
    Log::info("Batch done. Progress: {$batch->progress()}%");
})->dispatch();
```

---

## Events & Listeners {#events}

```php
// Events and listeners are unchanged in Laravel 13
class SaleConfirmed
{
    public function __construct(public readonly Sale $sale) {}
}

class DecrementStock implements ShouldQueue
{
    public function handle(SaleConfirmed $event): void
    {
        foreach ($event->sale->items as $item) {
            StockMovement::create([
                'product_id'     => $item->product_id,
                'type'           => 'out_sale',
                'quantity'       => -$item->quantity,
                'reference_id'   => $event->sale->id,
                'reference_type' => Sale::class,
            ]);
        }
    }
}
```

---

## Laravel 13 Specific Features {#laravel13}

### PHP Attributes — Full Reference Table

```php
// ── Models ────────────────────────────────────────────────────────────
use Illuminate\Database\Eloquent\Attributes\{
    Table,        // replaces: protected $table = '...'
    PrimaryKey,   // replaces: protected $primaryKey = '...'
    KeyType,      // replaces: protected $keyType = '...'
    Fillable,     // replaces: protected $fillable = [...]
    Guarded,      // replaces: protected $guarded = [...]
    Hidden,       // replaces: protected $hidden = [...]
    Visible,      // replaces: protected $visible = [...]
    Cast,         // replaces: entries in protected $casts (one attribute per cast)
    ObservedBy,   // replaces: Model::observe() call in ServiceProvider
    UseResource,  // links model to its API Resource class
    UseFactory,   // links model to its Factory class
    ScopedBy,     // adds a global scope
};

// ── Console Commands ──────────────────────────────────────────────────
use Illuminate\Console\Attributes\{
    Signature,          // replaces: protected $signature = '...'
    Description,        // replaces: protected $description = '...'
    Scheduled,          // NEW: define cron schedule directly on the command
    WithoutOverlapping, // prevents concurrent runs of the same command
};

// Example — schedule lives on the command itself, not routes/console.php
#[Signature('stock:check-alerts')]
#[Description('Check stock levels and dispatch alerts')]
#[Scheduled('hourly')]
#[WithoutOverlapping(60)]
class CheckStockAlertsCommand extends Command
{
    public function handle(AlertService $alerts): void
    {
        $alerts->runAllChecks();
    }
}

// ── Queue Jobs ────────────────────────────────────────────────────────
use Illuminate\Queue\Attributes\{
    Tries,                    // replaces: public int $tries = N
    Timeout,                  // replaces: public int $timeout = N
    Backoff,                  // replaces: public int|array $backoff = N
    FailOnTimeout,            // replaces: public bool $failOnTimeout = true
    DeleteWhenMissingModels,  // replaces: public bool $deleteWhenMissingModels = true
};

// ── Controllers ───────────────────────────────────────────────────────
use Illuminate\Routing\Attributes\Middleware;
use Illuminate\Auth\Attributes\Authorize;
```

### Auto Eager Loading (inherited from 12.x — still required)

```php
// Add to AppServiceProvider::boot() — prevents all N+1 queries globally
Model::automaticallyEagerLoadRelationships();

// Per query still preferred for explicit control
Product::with(['category', 'variants'])->paginate(20);
```

### Session Cache (inherited from 12.x)

```php
Cache::session()->put('dashboard_filters', $filters, 3600);
$filters = Cache::session()->get('dashboard_filters');
```

### Cache::touch() ⚠️ NEW IN 13

```php
// Extend a cached item's TTL without fetching or re-storing it.
// Practical for sliding-window expiry on expensive report caches.

// Before Laravel 13 (wasteful — reads and writes over Redis):
$stats = Cache::get('dashboard:stats');
Cache::put('dashboard:stats', $stats, now()->addMinutes(5));

// Laravel 13 (clean — no read required):
Cache::touch('dashboard:stats', now()->addMinutes(5));
```

### Cache Serialization Hardening ⚠️ SECURITY CHANGE IN 13

```php
// config/cache.php
// Laravel 13 defaults serializable_classes to false.
// This prevents PHP deserialization gadget chain attacks if APP_KEY leaks.
// If you intentionally store PHP objects in cache, explicitly allow them:

'stores' => [
    'redis' => [
        'driver' => 'redis',
        // ...
        'serializable_classes' => [
            App\Data\CachedDashboardStats::class,
            // list every class you deliberately cache as a PHP object
        ],
    ],
],

// Best practice: prefer arrays/scalars over serialized PHP objects in cache
```

### Failover Queue (inherited from 12.x)

```php
// config/queue.php
'connections' => [
    'primary'  => ['driver' => 'redis', ...],
    'fallback' => ['driver' => 'database', ...],
],
'default'  => 'failover',
'failover' => [
    'driver'      => 'failover',
    'connections' => ['primary', 'fallback'],
],
```

### HTTP Client afterResponse (inherited from 12.x)

```php
Http::acceptJson()
    ->baseUrl(config('services.external.url'))
    ->afterResponse(function (Response $response) {
        if ($response->failed()) {
            Log::warning('External API error', ['status' => $response->status()]);
        }
    })
    ->get('/endpoint');
```

### Service Pattern (unchanged — still the standard)

```php
class ProductService
{
    public function paginate(array $filters, int $perPage = 20): LengthAwarePaginator
    {
        return Product::query()
            ->active()
            ->when($filters['category_id'] ?? null, fn($q, $id) => $q->inCategory($id))
            ->when($filters['search'] ?? null, fn($q, $s) =>
                $q->where('name', 'ilike', "%{$s}%") // ilike = case-insensitive on PostgreSQL
            )
            ->with(['category'])
            ->latest()
            ->paginate($perPage);
    }

    public function create(array $data): Product
    {
        return DB::transaction(function () use ($data) {
            $product = Product::create($data);
            event(new ProductCreated($product));
            return $product;
        });
    }
}
```

### Upgrade Checklist — Laravel 12 → 13

```bash
# 1. Verify PHP 8.3+ is installed
php -v

# 2. Update composer.json
"require": {
    "php": "^8.3",
    "laravel/framework": "^13.0"
},
"require-dev": {
    "phpunit/phpunit": "^12.0"
}

# 3. Run the update
composer update

# 4. Clear all caches
php artisan optimize:clear

# 5. Review these three areas only:
#
#    a) CSRF: find any reference to VerifyCsrfToken or ValidateCsrfToken
#       → rename to PreventRequestForgery
#
#    b) Cache: check if you store PHP objects in cache
#       → add serializable_classes to config/cache.php
#
#    c) Schedules: optionally migrate routes/console.php to #[Scheduled] attributes
#       → not required, but cleaner

# 6. Run your full test suite
php artisan test
```
