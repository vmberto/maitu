import { expect, test } from '@playwright/test';

test.describe('App Login and List Creation Flow', () => {
  test('should login successfully with real database', async ({ page }) => {
    await page.goto('/login');

    // Verify we're on the login page
    await expect(page).toHaveURL('/login');
    await expect(page.locator('h1')).toContainText('maitu');

    // Fill in login form with seeded credentials
    await page.fill('input[name="email"]', 'test@user.com');
    await page.fill('input[name="password"]', 'testpassword123');

    // Submit form
    await page.click('button[type="submit"]');

    // Wait for redirect to main page after successful login
    await expect(page).toHaveURL('/', { timeout: 15_000 }); // wait up to 15s
    await expect(page.locator('h1')).toContainText('maitu');
  });

  test('should create a new list after login', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="email"]', 'test@user.com');
    await page.fill('input[name="password"]', 'testpassword123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/', { timeout: 15_000 });

    // Wait for the page to fully load
    await page.waitForLoadState('networkidle');

    // Take a screenshot before creating the list
    await page.screenshot({ path: 'debug-before-list-creation.png' });

    // Look for the New List button
    const newListButton = page.locator('button:has-text("New List")');
    await expect(newListButton).toBeVisible({ timeout: 10000 });

    // Click the New List button
    await newListButton.click();

    // Wait for the form elements to be present
    await page.waitForSelector('h2:has-text("New List")', { timeout: 10000 });

    // Fill in the list creation form
    const listTitle = 'Test Shopping List';
    const titleInput = page.locator('input[value=""][maxlength="30"]');
    await titleInput.fill(listTitle);

    const picker = page.locator('[data-testid="emoji-picker"]');
    await picker.locator('button:has-text("🧭")').click();

    // Take a screenshot after filling the form
    await page.screenshot({ path: 'debug-form-filled.png' });

    // Submit the form
    await page.click('button[type="submit"]:has-text("Submit")');

    // Wait for the form to submit and close
    await page.waitForTimeout(5000);

    // Take a screenshot after submission
    await page.screenshot({ path: 'debug-after-submission.png' });

    // Check if we're back on the main page (dialog should be closed)
    await expect(page.locator('h1')).toContainText('maitu');

    // Try to find the list with different selectors
    const listElement = page
      .locator(`text=${listTitle}`)
      .or(page.locator(`[data-testid*="list"]:has-text("${listTitle}")`))
      .or(page.locator(`div:has-text("${listTitle}")`));

    await expect(listElement).toBeVisible({ timeout: 10000 });
  });
});
