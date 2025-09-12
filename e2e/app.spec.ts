import { expect, test } from '@playwright/test';

test.describe('App Login and List Creation Flow', () => {
  test('should login successfully with real database', async ({ page }) => {
    await page.goto('/login');

    await expect(page).toHaveURL('/login');
    await expect(page.locator('h1')).toContainText('maitu');

    await page.fill('input[name="email"]', 'test@user.com');
    await page.fill('input[name="password"]', 'testpassword123');

    await page.click('button[type="submit"]');

    await expect(page).toHaveURL('/', { timeout: 15_000 }); // wait up to 15s
    await expect(page.locator('h1')).toContainText('maitu');
  });

  test('should create a new list after login', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="email"]', 'test@user.com');
    await page.fill('input[name="password"]', 'testpassword123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/', { timeout: 15_000 });

    const newListButton = page.locator('button:has-text("New List")');
    await expect(newListButton).toBeVisible({ timeout: 10000 });

    await newListButton.click();

    await page.waitForSelector('h2:has-text("New List")', { timeout: 10000 });

    const listTitle = 'Test Shopping List';
    const titleInput = page.locator('input[value=""][maxlength="30"]');
    await titleInput.fill(listTitle);

    const picker = page.locator('.EmojiPickerReact');
    await picker.locator('button[aria-label="earth africa"]').click();

    await page.click('button[type="submit"]:has-text("Submit")');

    await page.waitForTimeout(5000);

    await expect(page.locator('h1')).toContainText('maitu');

    const listElement = page.getByRole('link', {
      name: '🌍 Test Shopping List',
    });

    await expect(listElement).toBeVisible({ timeout: 10000 });

    const listDetailsButton = page.locator('button[aria-label="list-details"]');
    await expect(listDetailsButton).toBeVisible({ timeout: 10000 });
    await listDetailsButton.click();
    await page.waitForSelector('span:has-text("Select List Color")', {
      timeout: 10000,
    });

    const deleteInput = page.locator('input[value=""]');
    await deleteInput.fill(listTitle);
    await page.click('button[type="submit"]:has-text("Delete")');
  });
});
