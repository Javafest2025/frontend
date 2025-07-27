import { test, expect } from '@playwright/test';

test.describe('Login Flow', () => {
    test('should allow a user to login with valid credentials', async ({ page }) => {
        // Navigate to the login page
        await page.goto('/auth/login');

        // Wait for the page to load completely
        await page.waitForSelector('form');

        // Fill in the login form
        await page.fill('input[type="email"]', 'trisn.eclipse@gmail.com');
        await page.fill('input[type="password"]', 'password');

        // Click the login button
        await page.click('button[type="submit"]');

        // Wait for navigation to the home page after successful login
        await page.waitForURL('**/interface/home');

        // Verify we're logged in by checking for an element on the home page
        const pageTitle = await page.textContent('h1');
        expect(pageTitle).toContain('Research Projects');
    });

    test('should show an error with invalid credentials', async ({ page }) => {
        // Intercept the login API call and return a 401 error with a JSON body
        await page.route('**/api/v1/auth/login', route =>
            route.fulfill({
                status: 401,
                contentType: 'application/json',
                body: JSON.stringify({ message: 'Invalid email or password' }),
            })
        );
        // Navigate to the login page
        await page.goto('/auth/login');

        // Wait for the page to load completely
        await page.waitForSelector('form');

        // Fill in the login form with invalid credentials
        await page.fill('input[type="email"]', 'invalid@example.com');
        await page.fill('input[type="password"]', 'wrongpassword');

        // Click the login button
        await page.click('button[type="submit"]');

        // Wait for the password error message to appear under the password field
        const errorSelector = '#password-error';
        await page.waitForSelector(errorSelector);
        const errorMessage = await page.textContent(errorSelector);

        // Verify error message is displayed
        expect(errorMessage).toContain('Invalid email or password');
    });
}); 