import { test, expect, login } from './fixtures/auth';

/**
 * Form Validation E2E Tests
 * 
 * Verifies form validation behavior and error messages.
 */

test.describe('Sign In Form Validation', () => {

    test('shows error for empty email', async ({ page }) => {
        await page.goto('/sign-in');
        await page.waitForLoadState('domcontentloaded');

        // Fill only password
        await page.locator('#password').fill('somepassword');
        await page.getByRole('button', { name: /sign in/i }).click();

        // Should show validation error or not submit
        // HTML5 validation will prevent submission
        const emailInput = page.locator('#email');
        await expect(emailInput).toHaveAttribute('required', '');
    });

    test('shows error for empty password', async ({ page }) => {
        await page.goto('/sign-in');
        await page.waitForLoadState('domcontentloaded');

        // Fill only email
        await page.locator('#email').fill('test@example.com');
        await page.getByRole('button', { name: /sign in/i }).click();

        // Password should be required
        const passwordInput = page.locator('#password');
        await expect(passwordInput).toHaveAttribute('required', '');
    });

    test('shows error for invalid email format', async ({ page }) => {
        await page.goto('/sign-in');
        await page.waitForLoadState('domcontentloaded');

        await page.locator('#email').fill('notanemail');
        await page.locator('#password').fill('password123');
        await page.getByRole('button', { name: /sign in/i }).click();

        // Email input should be invalid
        const isValid = await page.locator('#email').evaluate((el: HTMLInputElement) => el.validity.valid);
        expect(isValid).toBe(false);
    });
});

test.describe('League Creation Form Validation', () => {

    test('create button is disabled with empty name', async ({ page }) => {
        await login(page);

        await page.goto('/league/create');
        await page.waitForLoadState('domcontentloaded');

        // Clear the name field
        await page.locator('#name').fill('');

        // Button should be disabled
        const button = page.getByRole('button', { name: /create league/i });
        await expect(button).toBeDisabled();
    });

    test('shows character count for league name', async ({ page }) => {
        await login(page);

        await page.goto('/league/create');
        await page.waitForLoadState('domcontentloaded');

        // Type a name
        await page.locator('#name').fill('Test League');

        // Should show character count
        await expect(page.getByText(/\/100/)).toBeVisible();
    });

    test('league name input has maxlength of 100', async ({ page }) => {
        await login(page);

        await page.goto('/league/create');
        await page.waitForLoadState('domcontentloaded');

        // Verify input has maxlength=100 attribute
        const nameInput = page.locator('#name');
        await expect(nameInput).toHaveAttribute('maxlength', '100');
    });

    test('button enables when valid name is entered', async ({ page }) => {
        await login(page);

        await page.goto('/league/create');
        await page.waitForLoadState('domcontentloaded');

        // Button should be disabled initially
        const button = page.getByRole('button', { name: /create league/i });
        await expect(button).toBeDisabled();

        // Enter a valid name
        await page.locator('#name').fill('My Test League');
        await page.waitForTimeout(300);

        // Button should now be enabled
        await expect(button).toBeEnabled();
    });
});
