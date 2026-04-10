<?php

declare(strict_types=1);

use App\Http\Controllers\Api\CategoryController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Category Routes  —  /api/v1/categories/*
|--------------------------------------------------------------------------
|
| All routes are protected via auth:sanctum in CategoryController::middleware().
| Authorization is handled via CategoryPolicy (Gate::policy in AppServiceProvider).
|
| GET    /api/v1/categories              index   (?tree=1 for nested)
| POST   /api/v1/categories              store
| GET    /api/v1/categories/{category}   show
| PUT    /api/v1/categories/{category}   update
| DELETE /api/v1/categories/{category}   destroy
| PUT    /api/v1/categories/{category}/schema  updateSchema
|
*/

Route::apiResource('categories', CategoryController::class);

Route::put(
    'categories/{category}/schema',
    [CategoryController::class, 'updateSchema'],
)->name('categories.schema');
