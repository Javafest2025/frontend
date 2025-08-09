import { test, expect } from '@playwright/test';

test.describe('Login Flow', () => {
    test('should allow a user to login with valid credentials', async ({ page }) => {
        // Listen for console errors
        page.on('console', msg => {
            if (msg.type() === 'error') {
                console.log('Browser console error:', msg.text());
            }
        });

        // Mock the login API call to return a successful response
        await page.route('**/api/v1/auth/login', route => {
            console.log('API call intercepted:', route.request().url());
            route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    success: true,
                    data: {
                        accessToken: 'mock-jwt-token',
                        userId: '123',
                        email: 'trisn.eclipse@gmail.com',
                        roles: ['user']
                    },
                    message: 'Login successful'
                }),
            });
        });

        // Navigate to the login page
        await page.goto('/login');

        // Wait for the page to load completely
        await page.waitForSelector('form');

        // Fill in the login form
        await page.fill('input[type="email"]', 'trisn.eclipse@gmail.com');
        await page.fill('input[type="password"]', '123456789');

        // Set the refreshToken cookie that the middleware expects before submitting
        await page.context().addCookies([
            {
                name: 'refreshToken',
                value: 'mock-refresh-token',
                domain: 'localhost',
                path: '/',
                httpOnly: true,
                secure: false,
                sameSite: 'Lax'
            }
        ]);

        // Add a small delay to ensure everything is loaded
        await page.waitForTimeout(1000);

        // Click the login button and wait for the API response
        await Promise.all([
            page.waitForResponse('**/api/v1/auth/login'),
            page.click('button[type="submit"]')
        ]);

        // Wait a bit for the login logic to complete
        await page.waitForTimeout(2000);

        // Verify login was successful by checking localStorage
        const token = await page.evaluate(() => localStorage.getItem('scholarai_token'));
        const user = await page.evaluate(() => localStorage.getItem('scholarai_user'));

        expect(token).toBe('mock-jwt-token');
        expect(user).toBeTruthy();

        // Parse user data to verify it's correct
        const userData = JSON.parse(user || '{}');
        expect(userData.email).toBe('trisn.eclipse@gmail.com');
        expect(userData.id).toBe('123');
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
        await page.goto('/login');

        // Wait for the page to load completely
        await page.waitForSelector('form');

        // Fill in the login form with invalid credentials
        await page.fill('input[type="email"]', 'invalid@example.com');
        await page.fill('input[type="password"]', 'wrongpassword');

        // Click the login button and wait for the API response
        await Promise.all([
            page.waitForResponse('**/api/v1/auth/login'),
            page.click('button[type="submit"]')
        ]);

        // Wait for the password error message to appear under the password field
        // The error element has the ID 'password-error' from the PasswordField component
        const errorSelector = '#password-error';
        await page.waitForSelector(errorSelector);
        const errorMessage = await page.textContent(errorSelector);

        // Verify error message is displayed
        expect(errorMessage).toContain('Invalid email or password');
    });
}); 