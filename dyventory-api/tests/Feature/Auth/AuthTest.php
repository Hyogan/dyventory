<?php

declare(strict_types=1);

namespace Tests\Feature\Auth;

use App\Enums\UserRole;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

/**
 * Feature tests for POST /api/v1/auth/login
 *                    POST /api/v1/auth/logout
 *                    GET  /api/v1/auth/me
 *
 * Uses PHPUnit 12 attribute syntax (#[Test], #[DataProvider]).
 * No @annotation docblocks — those are deprecated in PHPUnit 12.
 */
class AuthTest extends TestCase
{
    use RefreshDatabase;

    // ─────────────────────────────────────────────
    // Login
    // ─────────────────────────────────────────────

    #[Test]
    public function login_returns_token_and_user_on_valid_credentials(): void
    {
        $user = User::factory()->create([
            'email'    => 'admin@dyventory.app',
            'password' => bcrypt('secret123'),
            'role'     => UserRole::Admin,
        ]);

        $response = $this->postJson('/api/v1/auth/login', [
            'email'    => 'admin@dyventory.app',
            'password' => 'secret123',
        ]);

        $response->assertOk()
            ->assertJsonStructure([
                'data' => [
                    'token',
                    'user' => [
                        'id',
                        'name',
                        'email',
                        'role',
                        'role_label',
                        'role_label_fr',
                        'created_at',
                    ],
                ],
            ])
            ->assertJsonPath('data.user.id', $user->id)
            ->assertJsonPath('data.user.email', 'admin@dyventory.app')
            ->assertJsonPath('data.user.role', 'admin')
            ->assertJsonPath('data.user.role_label', 'Administrator')
            ->assertJsonPath('data.user.role_label_fr', 'Administrateur');

        // Token must be a non-empty string
        $this->assertNotEmpty($response->json('data.token'));
    }

    #[Test]
    public function login_returns_401_on_wrong_password(): void
    {
        User::factory()->create([
            'email'    => 'user@dyventory.app',
            'password' => bcrypt('correct-password'),
        ]);

        $this->postJson('/api/v1/auth/login', [
            'email'    => 'user@dyventory.app',
            'password' => 'wrong-password',
        ])->assertUnauthorized()
            ->assertJsonPath('message', __('auth.failed'));
    }

    #[Test]
    public function login_returns_401_on_unknown_email(): void
    {
        $this->postJson('/api/v1/auth/login', [
            'email'    => 'nobody@dyventory.app',
            'password' => 'anypassword',
        ])->assertUnauthorized();
    }

    #[Test]
    public function login_returns_422_when_email_is_missing(): void
    {
        $this->postJson('/api/v1/auth/login', [
            'password' => 'secret123',
        ])->assertUnprocessable()
            ->assertJsonValidationErrors(['email']);
    }

    #[Test]
    public function login_returns_422_when_password_is_missing(): void
    {
        $this->postJson('/api/v1/auth/login', [
            'email' => 'user@dyventory.app',
        ])->assertUnprocessable()
            ->assertJsonValidationErrors(['password']);
    }

    #[Test]
    public function login_returns_422_when_email_is_malformed(): void
    {
        $this->postJson('/api/v1/auth/login', [
            'email'    => 'not-an-email',
            'password' => 'secret123',
        ])->assertUnprocessable()
            ->assertJsonValidationErrors(['email']);
    }

    #[Test]
    public function login_returns_422_when_password_is_too_short(): void
    {
        $this->postJson('/api/v1/auth/login', [
            'email'    => 'user@dyventory.app',
            'password' => 'short',
        ])->assertUnprocessable()
            ->assertJsonValidationErrors(['password']);
    }

    #[Test]
    public function login_revokes_previous_tokens_before_issuing_new_one(): void
    {
        $user = User::factory()->create([
            'password' => bcrypt('secret123'),
        ]);

        // Create an existing token
        $oldToken = $user->createToken('old-token')->plainTextToken;

        $this->assertDatabaseCount('personal_access_tokens', 1);

        // Login again — should revoke all existing tokens
        $this->postJson('/api/v1/auth/login', [
            'email'    => $user->email,
            'password' => 'secret123',
        ])->assertOk();

        // Only 1 token should exist (the new one, old one revoked)
        $this->assertDatabaseCount('personal_access_tokens', 1);

        // The old token should no longer work
        $this->withToken($oldToken)
            ->getJson('/api/v1/auth/me')
            ->assertUnauthorized();
    }

    #[Test]
    public function login_response_does_not_expose_password(): void
    {
        User::factory()->create([
            'email'    => 'user@dyventory.app',
            'password' => bcrypt('secret123'),
        ]);

        $response = $this->postJson('/api/v1/auth/login', [
            'email'    => 'user@dyventory.app',
            'password' => 'secret123',
        ])->assertOk();

        $this->assertArrayNotHasKey('password', $response->json('data.user'));
        $this->assertArrayNotHasKey('remember_token', $response->json('data.user'));
    }

    /**
     * Verify each role gets the correct token abilities.
     *
     * @return array<string, array{UserRole, list<string>}>
     */
    public static function rolePermissionsProvider(): array
    {
        return [
            'admin has wildcard'      => [UserRole::Admin,      ['*']],
            'vendor can create sales' => [UserRole::Vendor,     ['sales:create']],
            'vendor cannot archive products' => [UserRole::Vendor, []],
            'warehouse can stock entry' => [UserRole::Warehouse, ['stock:entry']],
            'accountant can view tva reports' => [UserRole::Accountant, ['reports:tva']],
        ];
    }

    #[Test]
    #[DataProvider('rolePermissionsProvider')]
    public function login_scopes_token_abilities_to_role(
        UserRole $role,
        array $expectedAbilities,
    ): void {
        $user = User::factory()->create([
            'password' => bcrypt('secret123'),
            'role'     => $role,
        ]);

        $this->postJson('/api/v1/auth/login', [
            'email'    => $user->email,
            'password' => 'secret123',
        ])->assertOk();

        // Verify the token in the database has the correct abilities
        $token = $user->fresh()->tokens()->first();

        $this->assertNotNull($token);

        foreach ($expectedAbilities as $ability) {
            $this->assertTrue(
                $token->can($ability),
                "Token for role [{$role->value}] should have ability [{$ability}]",
            );
        }
    }

    // ─────────────────────────────────────────────
    // Logout
    // ─────────────────────────────────────────────

    #[Test]
    public function logout_revokes_current_token(): void
    {
        $user  = User::factory()->create();
        $token = $user->createToken('test-token')->plainTextToken;

        $this->withToken($token)
            ->postJson('/api/v1/auth/logout')
            ->assertNoContent();

        // Token should be gone from the database
        $this->assertDatabaseCount('personal_access_tokens', 0);

        // The revoked token should no longer authenticate
        $this->withToken($token)
            ->getJson('/api/v1/auth/me')
            ->assertUnauthorized();
    }

    #[Test]
    public function logout_only_revokes_current_token_not_all_tokens(): void
    {
        $user   = User::factory()->create();
        $token1 = $user->createToken('token-1')->plainTextToken;
        $token2 = $user->createToken('token-2')->plainTextToken;

        $this->assertDatabaseCount('personal_access_tokens', 2);

        // Log out with token1 only
        $this->withToken($token1)
            ->postJson('/api/v1/auth/logout')
            ->assertNoContent();

        // token2 should still exist
        $this->assertDatabaseCount('personal_access_tokens', 1);

        // token2 should still be valid
        $this->withToken($token2)
            ->getJson('/api/v1/auth/me')
            ->assertOk();
    }

    #[Test]
    public function logout_requires_authentication(): void
    {
        $this->postJson('/api/v1/auth/logout')
            ->assertUnauthorized();
    }

    // ─────────────────────────────────────────────
    // Me
    // ─────────────────────────────────────────────

    #[Test]
    public function me_returns_authenticated_user(): void
    {
        $user  = User::factory()->create(['role' => UserRole::Manager]);
        $token = $user->createToken('test')->plainTextToken;

        $this->withToken($token)
            ->getJson('/api/v1/auth/me')
            ->assertOk()
            ->assertJsonStructure([
                'data' => [
                    'id',
                    'name',
                    'email',
                    'role',
                    'role_label',
                    'role_label_fr',
                    'created_at',
                ],
            ])
            ->assertJsonPath('data.id', $user->id)
            ->assertJsonPath('data.role', 'manager')
            ->assertJsonPath('data.role_label', 'Manager');
    }

    #[Test]
    public function me_returns_401_without_token(): void
    {
        $this->getJson('/api/v1/auth/me')
            ->assertUnauthorized();
    }

    #[Test]
    public function me_returns_401_with_invalid_token(): void
    {
        $this->withToken('this-is-not-a-valid-token')
            ->getJson('/api/v1/auth/me')
            ->assertUnauthorized();
    }

    #[Test]
    public function me_does_not_expose_password_or_remember_token(): void
    {
        $user  = User::factory()->create();
        $token = $user->createToken('test')->plainTextToken;

        $response = $this->withToken($token)
            ->getJson('/api/v1/auth/me')
            ->assertOk();

        $userData = $response->json('data');

        $this->assertArrayNotHasKey('password', $userData);
        $this->assertArrayNotHasKey('remember_token', $userData);
    }

    #[Test]
    public function me_returns_fresh_data_after_role_update(): void
    {
        $user  = User::factory()->create(['role' => UserRole::Vendor]);
        $token = $user->createToken('test')->plainTextToken;

        // Promote to manager directly in DB (simulating an admin action)
        $user->update(['role' => UserRole::Manager]);

        $this->withToken($token)
            ->getJson('/api/v1/auth/me')
            ->assertOk()
            ->assertJsonPath('data.role', 'manager');
    }
}
