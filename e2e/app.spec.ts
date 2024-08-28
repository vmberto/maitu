import { expect, test } from '@playwright/test';

test('should navigate to the about page', async ({ page }) => {
  // Start from the index page (the baseURL is set via the webServer in the playwright.config.ts)
  await page.goto('/');
  // Find an element with the text 'About' and click on it
  await expect(page).toHaveURL('/');
  // The new page should contain a h1 with "About"
  await expect(page.locator('h1')).toContainText('maitu');
});
